#!/usr/bin/env node
import { createBlockCanvasServer } from './server.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = createBlockCanvasServer();
server.start(new StdioServerTransport()).catch(console.error);
