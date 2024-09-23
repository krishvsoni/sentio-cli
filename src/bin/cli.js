#!/usr/bin/env node

import axios from 'axios';
import { Command } from 'commander';
import fs from 'fs-extra';
import chalk from 'chalk';
import path from 'path';

// Initialize commander program
const program = new Command();

program
  .version('1.0.0')
  .description('CLI tool to analyze Lua files by sending them to an API')
  .argument('<luaFile>', 'Path to the .lua file')
  .action(async (luaFile) => {
    const filePath = path.resolve(process.cwd(), luaFile);

    try {
      if (!fs.existsSync(filePath)) {
        console.log(chalk.red(`Error: File ${luaFile} does not exist.`));
        process.exit(1);
      }

      const luaCode = await fs.readFile(filePath, 'utf-8');
      console.log(chalk.green(`Lua Code being sent: \n${luaCode}`));

      console.log(chalk.blue('Sending the Lua code for analysis...'));

      const response = await axios.post(
        'https://sam-offchain-dbedazdhd2dugrdk.eastus-01.azurewebsites.net/analyze',
        { code: luaCode },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        }
      );

      console.log(chalk.green('Analysis Result:'));

      // Loop through the results and format them
      response.data.forEach(issue => {
        const { description, line, name, severity } = issue;
        let color;

        // Set color based on severity
        if (severity === 'high') {
          color = chalk.red;
        } else if (severity === 'medium') {
          color = chalk.yellow;
        } else {
          color = chalk.white;
        }

        // Output the formatted result
        console.log(color(`${name} (Severity: ${severity})`));
        console.log(color(`Description: ${description}`));
        console.log(color(`Line: ${line}`));
        console.log('---'); // Separator for better readability
      });

    } catch (error) {
      if (error.response && error.response.data) {
        console.error(chalk.red(`Error: ${error.response.data.message || JSON.stringify(error.response.data)}`));
      } else {
        console.error(chalk.red(`Error: ${error.message}`));
      }
    }
  });

// Parse command line arguments
program.parse(process.argv);
