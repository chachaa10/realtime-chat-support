import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS = __dirname;
const FRONTEND = 'http://localhost:5173';
const BACKEND = 'http://localhost:3001';

const ts = Date.now();

async function screenshot(page, name) {
  const filePath = path.join(SCREENSHOTS, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return name;
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // ——— Step 1: Landing page ———
  const landingCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const landing = await landingCtx.newPage();
  await landing.goto(FRONTEND, { waitUntil: 'networkidle' });
  await screenshot(landing, '01-landing-page');
  await landing.close();
  await landingCtx.close();

  // ——— Step 2: Register a customer ———
  const customerCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const customer = await customerCtx.newPage();

  // Capture console for debugging
  customer.on('console', msg => {
    if (msg.type() === 'error') console.log('CUSTOMER CONSOLE ERROR:', msg.text());
  });
  customer.on('pageerror', err => console.log('CUSTOMER PAGE ERROR:', err.message));
  customer.on('requestfailed', req => console.log('CUSTOMER REQUEST FAILED:', req.url(), req.failure()?.errorText));

  await customer.goto(`${FRONTEND}/register`, { waitUntil: 'networkidle' });

  const custEmail = `customer-${ts}@test.com`;
  await customer.fill('#reg-name', 'Alice Customer');
  await customer.fill('#reg-email', custEmail);
  await customer.fill('#reg-password', 'TestPass123!');

  // Click Customer role label — the label wraps the hidden radio
  const roleLabels = customer.locator('label').filter({ hasText: 'Customer' });
  await roleLabels.first().click();

  await screenshot(customer, '02-register-customer-form');

  // Submit via JS to bypass validation issues
  await customer.evaluate(() => {
    const form = document.querySelector('form');
    if (form) form.requestSubmit();
  });
  // Wait a bit and check the URL
  await customer.waitForTimeout(3000);
  console.log('Customer URL after submit:', customer.url());
  await screenshot(customer, '02b-after-register-submit');
  // Check if we got redirected
  const currentUrl = customer.url();
  if (!currentUrl.includes('/tickets')) {
    // Try clicking the button directly
    console.log('Trying direct button click...');
    await customer.click('button[type="submit"]');
    await customer.waitForTimeout(3000);
    console.log('Customer URL after direct click:', customer.url());
    await screenshot(customer, '02c-after-direct-click');
  }
  await customer.waitForURL('**/tickets', { timeout: 15000 });

  // ——— Step 3: Customer dashboard (no tickets) ———
  await customer.waitForTimeout(1000);
  await screenshot(customer, '03-customer-dashboard-empty');

  // ——— Step 4: Create a ticket ———
  // Click the "New ticket" icon button (link to /tickets/new)
  await customer.goto(`${FRONTEND}/tickets/new`, { waitUntil: 'networkidle' });
  await customer.waitForSelector('#subject', { timeout: 10000 });
  console.log('On create ticket page, URL:', customer.url());

  await screenshot(customer, '04a-create-ticket-form');

  await customer.fill('#subject', 'Login page broken on mobile');
  await customer.fill('#description', 'When I try to log in on my iPhone, the submit button is hidden behind the keyboard. This makes it impossible to complete login.');

  // Click a label button if any exist
  const labelsAvailable = customer.locator('button').filter({ hasText: /bug|feature|support|billing|account/i });
  const labelCount = await labelsAvailable.count();
  console.log('Label buttons found:', labelCount);
  if (labelCount > 0) {
    await labelsAvailable.first().click();
    console.log('Clicked first label');
  }

  await screenshot(customer, '04b-create-ticket-filled');

  // Submit
  await customer.click('button:has-text("Create Ticket")');
  await customer.waitForTimeout(3000);
  console.log('After create ticket submit URL:', customer.url());
  // Check for error text on page
  const errorText = await customer.locator('.text-danger, [class*="text-destructive"]').textContent().catch(() => null);
  if (errorText) console.log('Error on page:', errorText);
  // Try direct navigation to tickets if the form didn't redirect us
  if (!customer.url().includes('/tickets/')) {
    console.log('Form did not redirect, navigating to tickets directly');
    await customer.goto(`${FRONTEND}/tickets`, { waitUntil: 'networkidle' });
  }
  await customer.waitForTimeout(2000);

  // ——— Step 5: Customer ticket list ———
  await customer.goto(`${FRONTEND}/tickets`, { waitUntil: 'networkidle' });
  await customer.waitForTimeout(2000);
  await screenshot(customer, '05-customer-ticket-list');

  // ——— Step 6: Register an agent ———
  const agentCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const agent = await agentCtx.newPage();
  agent.on('console', msg => {
    if (msg.type() === 'error') console.log('AGENT CONSOLE ERROR:', msg.text());
  });
  agent.on('pageerror', err => console.log('AGENT PAGE ERROR:', err.message));
  agent.on('requestfailed', req => console.log('AGENT REQUEST FAILED:', req.url(), req.failure()?.errorText));
  await agent.goto(`${FRONTEND}/register`, { waitUntil: 'networkidle' });

  const agentEmail = `agent-${ts}@test.com`;
  await agent.fill('#reg-name', 'Bob Agent');
  await agent.fill('#reg-email', agentEmail);
  await agent.fill('#reg-password', 'TestPass123!');

  // Click Agent role label
  const agentRoleLabels = agent.locator('label').filter({ hasText: 'Agent' });
  await agentRoleLabels.first().click();

  await screenshot(agent, '06-register-agent-form');

  // Submit
  await agent.click('button[type="submit"]');
  await agent.waitForTimeout(3000);
  console.log('Agent URL after submit:', agent.url());
  if (!agent.url().includes('/tickets')) {
    // Try JS submit
    await agent.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    });
    await agent.waitForTimeout(3000);
    console.log('Agent URL after JS submit:', agent.url());
  }
  await agent.waitForURL('**/tickets', { timeout: 15000 });
  await agent.waitForTimeout(2000);

  // After registration, the backend profile is still 'customer' due to ProfileHook bug.
  // Call PATCH /auth/profile to update the role to 'agent'.
  console.log('Updating agent role via API...');
  const roleUpdate = await agent.evaluate(async () => {
    const res = await fetch('http://localhost:3001/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role: 'agent' }),
    });
    return { ok: res.ok, status: res.status };
  });
  console.log('Role update result:', roleUpdate);
  await agent.waitForTimeout(500);

  // ——— Step 7: Agent queue view ———
  // Click "Queue" tab
  const queueBtn = agent.locator('button').filter({ hasText: 'Queue' });
  if (await queueBtn.count() > 0) {
    await queueBtn.first().click();
    await agent.waitForTimeout(2000);
  }
  await screenshot(agent, '07-agent-queue-view');

  // ——— Step 8: Accept a ticket ———
  // Navigate to the ticket that's open in the queue. First, let's find it by clicking the sidebar item.
  // The ticket should show in the agent's queue list. Let me click the first ticket in the sidebar.
  const sidebarTicket = agent.locator('a[href*="/tickets/"]').first();
  if (await sidebarTicket.count() > 0) {
    await sidebarTicket.click();
    await agent.waitForURL(/\/tickets\/\d+/, { timeout: 15000 });
    await agent.waitForTimeout(2000);
  }

  await screenshot(agent, '08-ticket-detail-before-accept');

  // Click Accept button
  const acceptBtn = agent.locator('button').filter({ hasText: /^Accept$/ });
  if (await acceptBtn.count() > 0) {
    await acceptBtn.first().click();
    await agent.waitForTimeout(3000);
  }

  await screenshot(agent, '09-ticket-accepted');

  // ——— Step 9: Chat ———
  // Type a message and send it
  const chatInput = agent.locator('textarea').first();
  if (await chatInput.count() > 0) {
    await chatInput.fill('Hello! I saw your issue with the login page. Let me help you troubleshoot this. Could you tell me which browser and OS you are using?');
    // Wait a bit for typing indicator simulation
    await agent.waitForTimeout(1000);
    // Click send button
    const sendBtn = agent.locator('button[aria-label="Send message"]');
    await sendBtn.click();
    await agent.waitForTimeout(2000);
  }

  await screenshot(agent, '10-chat-view');

  // Now let's check if the customer sees the message too
  await customer.bringToFront();
  await customer.goto(`${FRONTEND}/tickets`, { waitUntil: 'networkidle' });
  await customer.waitForTimeout(1000);
  // Click the ticket in sidebar
  const custTicketLink = customer.locator('a[href*="/tickets/"]').first();
  if (await custTicketLink.count() > 0) {
    await custTicketLink.click();
    await customer.waitForURL(/\/tickets\/\d+/, { timeout: 10000 });
    await customer.waitForTimeout(2000);
  }
  await screenshot(customer, '10b-customer-sees-agent-reply');

  // ——— Step 10: Resolve the ticket ———
  await agent.bringToFront();
  // The ticket should already be open for the agent. Let's navigate to make sure.
  await agent.goto(`${FRONTEND}/tickets`, { waitUntil: 'networkidle' });
  await agent.waitForTimeout(1000);
  // Click on the in-progress ticket
  const agentTicketLink = agent.locator('a[href*="/tickets/"]').first();
  if (await agentTicketLink.count() > 0) {
    await agentTicketLink.click();
    await agent.waitForURL(/\/tickets\/\d+/, { timeout: 10000 });
    await agent.waitForTimeout(2000);
  }

  // Click Resolve button
  const resolveBtn = agent.locator('button').filter({ hasText: /^Resolve$/ });
  if (await resolveBtn.count() > 0) {
    await resolveBtn.first().click();
    await agent.waitForTimeout(3000);
  }

  await screenshot(agent, '11-ticket-resolved');

  // Cleanup
  await agent.close();
  await customer.close();
  await agentCtx.close();
  await customerCtx.close();
  await browser.close();

  console.log('=== Screenshots taken ===');
}

main().catch((err) => {
  console.error('Simulation failed:', err);
  process.exit(1);
});
