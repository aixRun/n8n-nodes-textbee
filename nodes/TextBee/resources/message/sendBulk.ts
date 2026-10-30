import type { INodeProperties } from 'n8n-workflow';

import { deviceIdProperty, unwrapDataPostReceive } from '../../shared/descriptions';

const showOnlyForMessageSendBulk = {
	operation: ['sendBulk'],
	resource: ['message'],
};

export const messageSendBulkDescription: INodeProperties[] = [
	{
		displayName: 'Messages',
		name: 'messages',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		placeholder: 'Add Message',
		default: {},
		required: true,
		displayOptions: {
			show: showOnlyForMessageSendBulk,
		},
		options: [
			{
				displayName: 'Message',
				name: 'messageValues',
				values: [
					{
						displayName: 'Message',
						name: 'message',
						type: 'string',
						typeOptions: {
							rows: 3,
						},
						default: '',
						required: true,
						description: 'Text of this SMS entry',
					},
					{
						displayName: 'Recipients',
						name: 'recipients',
						type: 'string',
						default: '',
						required: true,
						placeholder: '+12015550123',
						description: 'E.164 numbers, comma-separated',
					},
					{
						displayName: 'SIM Subscription ID',
						name: 'simSubscriptionId',
						type: 'number',
						default: 0,
						description: 'Optional SIM subscription ID for this entry',
					},
					{
						displayName: 'Scheduled At',
						name: 'scheduledAt',
						type: 'dateTime',
						default: '',
						description: 'Optional ISO schedule time (up to 72 hours ahead)',
					},
				],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'messages',
				value: `={{ ($value.messageValues || []).map((m) => {
					const entry = {
						message: m.message,
						recipients: String(m.recipients || '').split(/[,\\n]/).map((r) => r.trim()).filter(Boolean),
					};
					if (m.simSubscriptionId) entry.simSubscriptionId = m.simSubscriptionId;
					if (m.scheduledAt) entry.scheduledAt = new Date(m.scheduledAt).toISOString();
					return entry;
				}) }}`,
			},
		},
	},
	{
		...deviceIdProperty,
		displayOptions: {
			show: showOnlyForMessageSendBulk,
		},
		routing: {
			send: {
				type: 'body',
				property: 'deviceId',
				value: '={{ $value && $value.value ? $value.value : undefined }}',
			},
		},
	},
	{
		displayName: 'Message Template Label',
		name: 'messageTemplate',
		type: 'string',
		default: '',
		description: 'Optional label for the batch (not the SMS body)',
		displayOptions: {
			show: showOnlyForMessageSendBulk,
		},
		routing: {
			send: {
				type: 'body',
				property: 'messageTemplate',
			},
		},
	},
];

export const messageSendBulkRouting = {
	request: {
		method: 'POST' as const,
		url: '/gateway/send-bulk-sms',
	},
	output: {
		postReceive: unwrapDataPostReceive,
	},
};
