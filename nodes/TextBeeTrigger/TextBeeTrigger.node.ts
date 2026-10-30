import { createHmac, timingSafeEqual } from 'crypto';

import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type JsonObject,
	type IHookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
} from 'n8n-workflow';

import { textBeeApiRequest } from '../TextBee/shared/transport';

type WebhookSubscription = {
	_id: string;
	deliveryUrl: string;
	events: string[];
	isActive: boolean;
};

type CreateWebhookResponse = {
	data: WebhookSubscription;
};

const EVENT_OPTIONS = [
	{
		name: 'Message Delivered',
		value: 'MESSAGE_DELIVERED',
		description: 'Carrier reports delivery to the recipient handset',
	},
	{
		name: 'Message Failed',
		value: 'MESSAGE_FAILED',
		description: 'Phone reports that an outgoing SMS failed',
	},
	{
		name: 'Message Received',
		value: 'MESSAGE_RECEIVED',
		description: 'Phone uploads an incoming SMS',
	},
	{
		name: 'Message Sent',
		value: 'MESSAGE_SENT',
		description: 'Phone reports that the carrier accepted an outgoing SMS',
	},
	{
		name: 'Unknown State',
		value: 'UNKNOWN_STATE',
		description: 'Phone reports a status that TextBee cannot map',
	},
];

function sameEvents(a: string[], b: string[]): boolean {
	return [...a].sort().join(',') === [...b].sort().join(',');
}

export class TextBeeTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TextBee Trigger',
		name: 'textBeeTrigger',
		icon: { light: 'file:../../icons/sms.svg', dark: 'file:../../icons/sms.dark.svg' },
		group: ['trigger'],
		version: [1],
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when TextBee sends an SMS webhook event',
		defaults: {
			name: 'TextBee Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'textBeeApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: EVENT_OPTIONS,
				default: ['MESSAGE_RECEIVED'],
				required: true,
				description: 'TextBee events that should trigger this workflow',
			},
			{
				displayName:
					'Receive SMS must be enabled in the TextBee Android app for MESSAGE_RECEIVED events. TextBee rejects private/loopback delivery URLs — use a public HTTPS webhook URL (or a tunnel in development). Set a Webhook Signing Secret (at least 20 characters) on the TextBee API credential.',
				name: 'triggerNotice',
				type: 'notice',
				default: '',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default');
				const events = this.getNodeParameter('events') as string[];

				if (!webhookData.webhookId) {
					return false;
				}

				try {
					const response = (await textBeeApiRequest.call(
						this,
						'GET',
						`/webhooks/${webhookData.webhookId}`,
					)) as CreateWebhookResponse;
					const subscription = response.data;
					if (!subscription || !subscription.isActive) {
						delete webhookData.webhookId;
						return false;
					}
					if (subscription.deliveryUrl !== webhookUrl) {
						return false;
					}
					return sameEvents(subscription.events ?? [], events);
				} catch {
					delete webhookData.webhookId;
					return false;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default');
				const events = this.getNodeParameter('events') as string[];
				const credentials = await this.getCredentials('textBeeApi');
				const signingSecret = credentials.webhookSigningSecret as string;

				if (!signingSecret || signingSecret.length < 20) {
					throw new NodeOperationError(
						this.getNode(),
						'Webhook Signing Secret on the TextBee API credential must be at least 20 characters',
					);
				}

				const body: IDataObject = {
					name: `n8n: ${this.getWorkflow().name ?? 'workflow'}`.slice(0, 64),
					deliveryUrl: webhookUrl,
					signingSecret,
					events,
				};

				const response = (await textBeeApiRequest.call(
					this,
					'POST',
					'/webhooks',
					body,
				)) as CreateWebhookResponse;

				webhookData.webhookId = response.data._id;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookId = webhookData.webhookId as string | undefined;

				if (!webhookId) {
					return true;
				}

				try {
					await textBeeApiRequest.call(this, 'DELETE', `/webhooks/${webhookId}`);
				} catch (error) {
					// Subscription may already be gone (404); surface other failures
					const status =
						typeof error === 'object' &&
						error !== null &&
						'httpCode' in error &&
						typeof (error as { httpCode?: unknown }).httpCode === 'string'
							? (error as { httpCode: string }).httpCode
							: undefined;
					const message = error instanceof Error ? error.message : String(error);
					if (status !== '404' && !/not found/i.test(message)) {
						throw new NodeApiError(this.getNode(), error as JsonObject);
					}
				}

				delete webhookData.webhookId;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const credentials = await this.getCredentials('textBeeApi');
		const signingSecret = credentials.webhookSigningSecret as string;
		const headerData = this.getHeaderData();
		const signatureHeader = (headerData['x-signature'] ?? headerData['X-Signature']) as
			| string
			| undefined;

		const rawBody = this.getRequestObject().rawBody;
		const bodyBuffer = Buffer.isBuffer(rawBody)
			? rawBody
			: Buffer.from(typeof rawBody === 'string' ? rawBody : JSON.stringify(this.getBodyData()));

		if (!signingSecret || !signatureHeader) {
			const res = this.getResponseObject();
			res.status(401).json({ error: 'Missing signature or signing secret' });
			return { noWebhookResponse: true };
		}

		const expected = createHmac('sha256', signingSecret).update(bodyBuffer).digest('hex');
		const provided = signatureHeader.trim().toLowerCase();

		const expectedBuf = Buffer.from(expected, 'utf8');
		const providedBuf = Buffer.from(provided, 'utf8');

		if (expectedBuf.length !== providedBuf.length || !timingSafeEqual(expectedBuf, providedBuf)) {
			const res = this.getResponseObject();
			res.status(401).json({ error: 'Invalid signature' });
			return { noWebhookResponse: true };
		}

		const bodyData = this.getBodyData();
		const events = this.getNodeParameter('events') as string[];
		const eventName = bodyData.webhookEvent as string | undefined;

		if (eventName && !events.includes(eventName)) {
			return {
				workflowData: [[]],
			};
		}

		return {
			workflowData: [this.helpers.returnJsonArray([bodyData])],
		};
	}
}
