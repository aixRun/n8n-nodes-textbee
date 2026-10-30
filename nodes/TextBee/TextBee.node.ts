import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

import { searchDevices } from './listSearch/searchDevices';
import { deviceDescription } from './resources/device';
import { messageDescription } from './resources/message';
import { statsDescription } from './resources/stats';
import { webhookDescription } from './resources/webhook';
import { baseUrlExpression } from './shared/baseUrl';

export class TextBee implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TextBee',
		name: 'textBee',
		icon: { light: 'file:../../icons/sms.svg', dark: 'file:../../icons/sms.dark.svg' },
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Send and manage SMS through TextBee',
		defaults: {
			name: 'TextBee',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'textBeeApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: baseUrlExpression,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Device',
						value: 'device',
					},
					{
						name: 'Message',
						value: 'message',
					},
					{
						name: 'Account',
						value: 'account',
					},
					{
						name: 'Webhook Subscription',
						value: 'webhook',
					},
				],
				default: 'message',
			},
			...messageDescription,
			...deviceDescription,
			...statsDescription,
			...webhookDescription,
		],
	};

	methods = {
		listSearch: {
			searchDevices,
		},
	};
}
