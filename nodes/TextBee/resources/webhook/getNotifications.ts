import type { INodeProperties } from 'n8n-workflow';

const showOnlyForWebhookNotifications = {
	operation: ['getNotifications'],
	resource: ['webhook'],
};

export const webhookGetNotificationsDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: showOnlyForWebhookNotifications,
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 50,
		description: 'Max number of results to return',
		displayOptions: {
			show: {
				...showOnlyForWebhookNotifications,
				returnAll: [false],
			},
		},
		routing: {
			send: {
				type: 'query',
				property: 'limit',
			},
		},
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: showOnlyForWebhookNotifications,
		},
		options: [
			{
				displayName: 'Device ID',
				name: 'deviceId',
				type: 'string',
				default: '',
				routing: {
					send: {
						type: 'query',
						property: 'deviceId',
					},
				},
			},
			{
				displayName: 'End',
				name: 'end',
				type: 'dateTime',
				default: '',
				routing: {
					send: {
						type: 'query',
						property: 'end',
						value: '={{ $value ? new Date($value).toISOString() : undefined }}',
					},
				},
			},
			{
				displayName: 'Event Type',
				name: 'eventType',
				type: 'options',
				options: [
					{ name: 'Message Delivered', value: 'MESSAGE_DELIVERED' },
					{ name: 'Message Failed', value: 'MESSAGE_FAILED' },
					{ name: 'Message Received', value: 'MESSAGE_RECEIVED' },
					{ name: 'Message Sent', value: 'MESSAGE_SENT' },
					{ name: 'Unknown State', value: 'UNKNOWN_STATE' },
				],
				default: 'MESSAGE_RECEIVED',
				routing: {
					send: {
						type: 'query',
						property: 'eventType',
					},
				},
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				routing: {
					send: {
						type: 'query',
						property: 'page',
					},
				},
			},
			{
				displayName: 'Start',
				name: 'start',
				type: 'dateTime',
				default: '',
				routing: {
					send: {
						type: 'query',
						property: 'start',
						value: '={{ $value ? new Date($value).toISOString() : undefined }}',
					},
				},
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Delivered', value: 'delivered' },
					{ name: 'Failed', value: 'failed' },
					{ name: 'Pending', value: 'pending' },
					{ name: 'Retrying', value: 'retrying' },
				],
				default: 'delivered',
				routing: {
					send: {
						type: 'query',
						property: 'status',
					},
				},
			},
			{
				displayName: 'Webhook Subscription ID',
				name: 'webhookSubscriptionId',
				type: 'string',
				default: '',
				routing: {
					send: {
						type: 'query',
						property: 'webhookSubscriptionId',
					},
				},
			},
		],
	},
];

export const webhookGetNotificationsRouting = {
	request: {
		method: 'GET' as const,
		url: '/webhooks/notifications',
	},
	output: {
		postReceive: [
			{
				type: 'rootProperty' as const,
				properties: {
					property: 'data',
				},
			},
			{
				type: 'rootProperty' as const,
				properties: {
					property: 'data',
				},
			},
		],
	},
};
