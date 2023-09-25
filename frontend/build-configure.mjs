import { readFile, writeFile } from 'node:fs';

const CRON_SECURITY = process.env.CRON_SECURITY;
const vercelOutput = '.vercel/output/config.json';

readFile(vercelOutput, (error, data) => {
	if (error) {
		return console.log(error);
	}

	const jsonConfig = JSON.parse(data);

	jsonConfig.crons = [
		{
			path: `/api/daily-crawler?key=${CRON_SECURITY}`,
			schedule: '0 10 * * *',
		},
		{
			path: `/api/daily-storage?key=${CRON_SECURITY}`,
			schedule: '0 0 1,15 * *',
		},
	];

	writeFile(vercelOutput, JSON.stringify(jsonConfig, null, 2), (error) => {
		if (error) {
			console.log('An error has occurred ', error);
			return;
		}
		console.log('Updated vercel config.');
	});
});
