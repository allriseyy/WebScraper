export interface PlaywrightAction {
    action: string;
    selector?: string;
    url?: string;
    value?: string;
    text?: string;
    filename?: string;
    timeout?: number;
}

export interface ActionResult {
    action: PlaywrightAction;
    status: 'success' | 'error';
    result?: string;
    error?: string;
}
export interface TestExecutionResult {
    instruction: string;
    generatedActions?: PlaywrightAction[];
    executionResults?: {
        results: ActionResult[];
    }
    status: 'completed' | 'error';
    error?: string;
    timestamp: Date;
    duration?: number;
}
export interface PageContext {
    url: string;
    title: string;
    textContent: string;
}
export interface AgentConfig {
    headless: boolean;
    timeout: number;
    screenshot: boolean;
}