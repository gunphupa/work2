import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { getFlow } from '../../src/data/flows';
const cases: [string, string[]][] = [
  ['slow', ['high', 'known']],
  ['cpu', ['high', 'known']],
  ['memory', ['high', 'known']],
  ['disk', ['high', 'transfer']],
  ['freeze', ['app']],
  ['heat', ['warm', 'blocked']],
  ['gaming', ['frames', 'no', 'yes']],
  ['wifi', ['off']],
  ['internet', ['one']],
  ['microphone', ['yes', 'yes', 'yes', 'blocked']],
  ['sound', ['wrong']],
  ['usb', ['safe', 'works']],
  ['monitor', ['yes', 'wrong']],
  ['boot', ['power', 'loose']],
  ['driver', ['yes', 'yes']],
];
async function begin(page: Page, id: string) {
  await page.goto(`/diagnose/${id}`);
  await page.getByRole('radio', { name: 'Windows 11', exact: true }).check();
  await page.getByRole('button', { name: 'Begin the checks', exact: true }).click();
}
async function answer(page: Page, label: string) {
  await page.getByRole('radio', { name: label, exact: true }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}
async function normalSlowdownReadings(page: Page) {
  await begin(page, 'slow');
  for (const label of [
    'CPU stays below 50%',
    'Below 85%',
    'Disk is not consistently high',
    'More free space is available',
  ])
    await answer(page, label);
}
for (const [id, answers] of cases)
  test(`${id}: diagnose, verify and complete`, async ({ page }) => {
    const flow = getFlow(id)!;
    await begin(page, id);
    let node = flow.nodes.find((n) => n.id === flow.start)!;
    for (const answerId of answers) {
      if (node.kind !== 'question') throw new Error('Expected question');
      const option = node.options.find((o) => o.id === answerId)!;
      await answer(page, option.label.en);
      node = flow.nodes.find((n) => n.id === option.next)!;
    }
    if (node.kind !== 'fix') throw new Error('Expected a supported fix');
    if (node.risk === 'caution') {
      await expect(
        page.getByRole('heading', { name: node.title.en, exact: true }),
      ).not.toBeVisible();
      await page
        .getByRole('checkbox', {
          name: 'I understand the risk and can follow this step safely.',
          exact: true,
        })
        .check();
    }
    await expect(page.getByRole('heading', { name: node.title.en, exact: true })).toBeVisible();
    await page.getByRole('radio', { name: "Yes, it's fixed", exact: true }).check();
    await page.getByRole('button', { name: 'Record result', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Back to working.', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Help make the next diagnosis better.', exact: true }),
    ).toBeVisible();
  });
test('failed fix retains evidence, Other and Not sure guide safely', async ({ page }) => {
  await begin(page, 'microphone');
  await answer(page, 'Yes, my microphone is listed');
  await answer(page, 'A different microphone is selected');
  await page.getByRole('radio', { name: 'No change', exact: true }).check();
  await page.getByRole('button', { name: 'Record result', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Does the input meter move when you speak?', exact: true }),
  ).toBeVisible();
  await page.getByRole('radio', { name: 'I’m not sure', exact: true }).check();
  await expect(page.getByText('No problem. Let’s check together.', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'I still can’t check · skip this test', exact: true })
    .click();
  await page.getByRole('radio', { name: 'Something else', exact: true }).check();
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled();
  await page
    .getByRole('textbox', { name: 'Describe what you noticed', exact: true })
    .first()
    .fill('Managed by my school');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await answer(page, 'No, it fails in both');
  await expect(
    page.getByRole('heading', { name: 'Let’s try the next checks.', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('You tried the suggested actions,', { exact: false })).toBeVisible();
  await page.locator('summary').filter({ hasText: 'Evidence so far' }).click();
  await expect(page.getByText('Managed by my school', { exact: false })).toBeVisible();
});

test('normal resource readings continue to an app fix with AI unavailable', async ({ page }) => {
  await page.route('**/api/interpret', (route) => route.abort());
  await normalSlowdownReadings(page);
  await answer(page, 'Mostly in one app');
  await answer(page, 'Other local apps work normally');
  await expect(
    page.getByRole('heading', {
      name: 'Restart the affected app with less work open',
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('radio', { name: "Yes, it's fixed", exact: true }).check();
  await page.getByRole('button', { name: 'Record result', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Back to working.', exact: true })).toBeVisible();
  const findings = page.getByRole('region', { name: 'What your checks found', exact: true });
  await expect(findings).toContainText('A particular application');
  await expect(findings).toContainText('CPU stays below 50%');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('a replacement monitor setup is verified before completing', async ({ page }) => {
  await begin(page, 'monitor');
  for (const label of [
    'Yes, its menu appears',
    'It matches the connected cable',
    'Still no signal',
    'A replacement cable or display works',
  ])
    await answer(page, label);
  await expect(
    page.getByRole('heading', { name: 'Verify the working display setup', exact: true }),
  ).toBeVisible();
  await page.getByRole('radio', { name: "Yes, it's fixed", exact: true }).check();
  await page.getByRole('button', { name: 'Record result', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Back to working.', exact: true })).toBeVisible();
});

test('an uncertain ending shows the missing check and preserves findings in both languages', async ({
  page,
}) => {
  await normalSlowdownReadings(page);
  await page.getByRole('radio', { name: 'I’m not sure', exact: true }).check();
  await page
    .getByRole('button', { name: 'I still can’t check · skip this test', exact: true })
    .click();
  await expect(page.getByText('The last check was uncertain,', { exact: false })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Where this path stopped', exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator('.completion-findings')
      .filter({ has: page.getByRole('heading', { name: 'Where this path stopped', exact: true }) })
      .getByText('When do you notice the slowdown?', { exact: true }),
  ).toBeVisible();
  const findings = page.getByRole('region', { name: 'What your checks found', exact: true });
  await expect(findings).toContainText('Low free storage');
  await expect(findings).not.toContainText('A particular application');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'ไทย', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'สิ่งที่การตรวจพบ', exact: true })).toBeVisible();
  await expect(page.getByText('การตรวจล่าสุดยังไม่แน่ใจ', { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: 'test-results/findings-thai-mobile.png', fullPage: true });
});
test('numeric reading branches without rounding away evidence', async ({ page }) => {
  await begin(page, 'memory');
  await page.getByLabel('Or enter the percentage you see', { exact: true }).fill('92.5');
  await page.getByRole('button', { name: 'Use this reading', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'What is using the most memory?', exact: true }),
  ).toBeVisible();
});
test('an unresolved shared Wi-Fi failure retains its supported lead', async ({ page }) => {
  await begin(page, 'wifi');
  for (const label of [
    'Wi-Fi is on; airplane mode is off',
    'Yes, my network is listed',
    'Connected, but no internet',
    'Neither device can access the internet',
  ])
    await answer(page, label);
  await expect(
    page.getByRole('heading', { name: 'A useful lead, but no verified fix yet.', exact: true }),
  ).toBeVisible();
  const findings = page.getByRole('region', { name: 'What your checks found', exact: true });
  const router = findings.getByRole('listitem').filter({ hasText: 'Router or internet provider' });
  await expect(router).toContainText('Likely');
  await expect(router).toContainText('Neither device can access the internet');
  await expect(findings).not.toContainText('Network sign-in or credentials');
});
test('unsupported system prevents starting; off-topic and unavailable requests remain usable', async ({
  page,
}) => {
  await page.goto('/diagnose/slow');
  await page.getByRole('radio', { name: 'Another operating system', exact: true }).check();
  await expect(page.getByRole('button', { name: 'Begin the checks', exact: true })).toBeDisabled();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('supports Windows 10');
  await page.goto('/');
  await page
    .getByRole('textbox', { name: 'What’s happening with your computer?', exact: true })
    .fill('Write my history homework');
  await page.getByRole('button', { name: 'Start troubleshooting', exact: true }).click();
  await expect(
    page.getByText('FixFlow helps with Windows computer troubleshooting.', { exact: false }),
  ).toBeVisible();
  await page.route('**/api/interpret', (route) => route.abort());
  await page
    .getByRole('textbox', { name: 'What’s happening with your computer?', exact: true })
    .fill('My microphone stopped working');
  await page.getByRole('button', { name: 'Start troubleshooting', exact: true }).click();
  await expect(page.getByText('AI interpretation is unavailable.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Begin the checks', exact: true }).click();
  await expect(page).toHaveURL(/diagnose\/microphone/);
});
test('feedback retries, saves once, and only submits consented fields', async ({ page }) => {
  await begin(page, 'wifi');
  await answer(page, 'Wi-Fi is off or airplane mode is on');
  await page.getByRole('radio', { name: "Yes, it's fixed", exact: true }).check();
  await page.getByRole('button', { name: 'Record result', exact: true }).click();
  await page.getByRole('radio', { name: 'Yes', exact: true }).check();
  for (const question of [
    'How clear were the instructions?',
    'How easy was FixFlow to use?',
    'Were the questions relevant?',
  ])
    await page
      .getByRole('group', { name: question, exact: true })
      .getByRole('radio', { name: '5', exact: true })
      .check();
  await page.route('**/api/feedback', (route) =>
    route.fulfill({ status: 503, json: { error: 'Test failure' } }),
  );
  await page.getByRole('button', { name: 'Send feedback', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('could not be saved');
  await page.unroute('**/api/feedback');
  const responsePromise = page.waitForResponse('**/api/feedback');
  await page.getByRole('button', { name: 'Send feedback', exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  const payload = response.request().postDataJSON();
  expect(payload.comment).toBe('');
  expect(payload).not.toHaveProperty('notes');
  expect(payload).not.toHaveProperty('context');
  await expect(
    page.getByText('Thank you. Your feedback has been saved.', { exact: true }),
  ).toBeVisible();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download your summary', exact: true }).click();
  expect((await downloaded).suggestedFilename()).toBe('fixflow-summary.json');
});
test('Thai mobile flow, responsive layout and no automatic session restore', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'ไทย', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'th');
  await expect(page.getByRole('heading', { name: 'เริ่มตรวจตรงไหนดี', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /ไมโครโฟนใช้งานไม่ได้/ }).click();
  await page.getByRole('radio', { name: 'Windows 11', exact: true }).check();
  await page.getByRole('button', { name: 'เริ่มตรวจสอบ', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Windows พบไมโครโฟนหรือไม่', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('radio', { name: 'ไม่แน่ใจ', exact: true }).check();
  await expect(page.getByText('ไม่เป็นไร มาตรวจด้วยกัน', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/thai-mobile.png', fullPage: true });
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'First, a little context.', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});
test('desktop and mobile pages pass automated accessibility checks', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await begin(page, 'microphone');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: 'test-results/diagnostic-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(errors).toEqual([]);
});
test('safety stop and navigation pages explain the scope', async ({ page }) => {
  await begin(page, 'heat');
  await answer(page, 'Smoke, burning smell, swelling, or repeated shutdowns');
  await expect(
    page.getByRole('heading', { name: 'Stop testing and get qualified help.', exact: true }),
  ).toBeVisible();
  await page.goto('/how-it-works');
  await expect(
    page.getByRole('heading', { name: 'Answer simple questions', exact: true }),
  ).toBeVisible();
  await page.goto('/about');
  await expect(
    page.getByRole('heading', { name: 'Rules lead. AI assists.', exact: true }),
  ).toBeVisible();
  await page.goto('/diagnose/unknown-flow');
  await expect(page.getByRole('main')).toContainText('We couldn’t continue');
});

test('free-text context and language switching preserve the active investigation', async ({
  page,
}) => {
  await begin(page, 'microphone');
  await page.getByRole('radio', { name: 'Yes, my microphone is listed', exact: true }).check();
  await page.locator('.context-note summary').click();
  await page
    .getByLabel('Describe what you noticed', { exact: true })
    .fill('My microphone stops after 10 minutes, but works after restarting.');
  await page.getByRole('button', { name: 'Add context', exact: true }).click();
  await expect(page.locator('.context-note [role="status"]')).toContainText(
    'Added to this session.',
  );
  await expect(
    page.getByRole('radio', { name: 'Yes, my microphone is listed', exact: true }),
  ).toBeChecked();
  await page.getByRole('button', { name: 'ไทย', exact: true }).click();
  await expect(page.locator('.context-note [role="status"]')).toContainText('เพิ่มในครั้งนี้แล้ว');
  await expect(page.getByRole('radio', { name: 'มีไมโครโฟนในรายการ', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'ต่อไป', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'เลือกอุปกรณ์รับเสียงถูกต้องหรือไม่', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('ตัดออกตามผลการตรวจ', { exact: false })).toBeVisible();
});

test('reported gaming dead end now reaches region verification without AI', async ({ page }) => {
  await page.route('**/api/interpret', (route) => route.abort());
  await begin(page, 'gaming');
  for (const label of [
    'Players jump around or online actions are delayed',
    'Only this game is affected',
    'No relevant outage is reported',
    'A distant region is selected and I can change it',
  ])
    await answer(page, label);
  await expect(
    page.getByRole('heading', { name: 'Try the game’s recommended nearby region', exact: true }),
  ).toBeVisible();
  await page.getByRole('radio', { name: "Yes, it's fixed", exact: true }).check();
  await page.getByRole('button', { name: 'Record result', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Back to working.', exact: true })).toBeVisible();
});

test('a confirmed game outage gives a recovery plan and no false success control', async ({
  page,
}) => {
  await begin(page, 'gaming');
  for (const label of [
    'Players jump around or online actions are delayed',
    'Only this game is affected',
    'An outage affects my region or game mode',
  ])
    await answer(page, label);
  const next = page.getByRole('region', { name: 'Recommended next checks', exact: true });
  await expect(
    next.getByRole('heading', { name: /Wait for the game service to recover/ }),
  ).toBeVisible();
  await expect(next).toContainText('official status page');
  await expect(next.getByRole('combobox')).toHaveCount(0);
});

test('reported internet path offers follow-ups, reviews without a key, and avoids failed repeats', async ({
  page,
}) => {
  await begin(page, 'internet');
  for (const label of [
    'Several services are slow',
    'Only this computer is slow',
    'No difference / Ethernet',
    'No known large transfers',
  ])
    await answer(page, label);
  await expect(
    page.getByRole('heading', {
      name: 'Does another browser load the same pages normally?',
      exact: true,
    }),
  ).toBeVisible();
  for (const label of [
    'Both browsers are slow',
    'Nothing looks abnormal',
    'No relevant incident is listed',
  ])
    await answer(page, label);
  const next = page.getByRole('region', { name: 'Recommended next checks', exact: true });
  await expect(next.getByRole('heading', { name: /Reconnect only this computer/ })).toBeVisible();
  await expect(next).not.toContainText('Inspect the router’s external connections');
  await next.getByText('Help prioritize these checks', { exact: true }).click();
  await next
    .getByLabel('Any extra detail? (optional)', { exact: true })
    .fill('Only this laptop is affected');
  const responsePromise = page.waitForResponse('**/api/followups');
  await next.getByRole('button', { name: 'Review my next checks', exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  const payload = response.request().postDataJSON();
  expect(payload).not.toHaveProperty('sessionId');
  expect(payload).not.toHaveProperty('notes');
  expect(payload.detail).toBe('Only this laptop is affected');
  await expect(next.getByRole('status')).toContainText('Built-in recommendations are ready.');
  const first = next.getByRole('article', {
    name: 'Reconnect only this computer’s Wi-Fi once',
    exact: true,
  });
  await first.getByRole('combobox').selectOption('no_change');
  await first.getByRole('button', { name: 'Save follow-up result', exact: true }).click();
  await expect(first).toHaveCount(0);
  await expect(
    next.getByRole('article', { name: 'Inspect the active network adapter’s status', exact: true }),
  ).toBeVisible();
});

test('follow-up results require confirmation and remain useful when AI requests fail', async ({
  page,
}) => {
  await begin(page, 'wifi');
  for (const label of [
    'Wi-Fi is on; airplane mode is off',
    'Yes, my network is listed',
    'Connected, but no internet',
    'Neither device can access the internet',
  ])
    await answer(page, label);
  const next = page.getByRole('region', { name: 'Recommended next checks', exact: true });
  await page.route('**/api/followups', (route) => route.abort());
  await next.getByText('Help prioritize these checks', { exact: true }).click();
  await next.getByRole('button', { name: 'Review my next checks', exact: true }).click();
  await expect(next.getByRole('status')).toContainText('AI review is unavailable.');
  const first = next.getByRole('article').first();
  await expect(
    first.getByRole('button', { name: 'Save follow-up result', exact: true }),
  ).toBeDisabled();
  await first.getByRole('combobox').selectOption('fixed');
  await first.getByRole('button', { name: 'Save follow-up result', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Back to working.', exact: true })).toBeVisible();
  await expect(next).toHaveCount(0);
});

test('a worsening follow-up stops further suggestions and explains how to stop', async ({
  page,
}) => {
  await begin(page, 'wifi');
  for (const label of [
    'Wi-Fi is on; airplane mode is off',
    'Yes, my network is listed',
    'Connected, but no internet',
    'Neither device can access the internet',
  ])
    await answer(page, label);
  const first = page
    .getByRole('region', { name: 'Recommended next checks', exact: true })
    .getByRole('article')
    .first();
  await first.getByRole('combobox').selectOption('worse');
  await first.getByRole('button', { name: 'Save follow-up result', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Stop this step and review the change.', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Stop this follow-up.', { exact: false })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Recommended next checks', exact: true }),
  ).toHaveCount(0);
});

test('Thai recommendations preserve selections and pass mobile accessibility', async ({ page }) => {
  await begin(page, 'wifi');
  for (const label of [
    'Wi-Fi is on; airplane mode is off',
    'Yes, my network is listed',
    'Connected, but no internet',
    'Neither device can access the internet',
  ])
    await answer(page, label);
  const first = page
    .getByRole('region', { name: 'Recommended next checks', exact: true })
    .getByRole('article')
    .first();
  await first.getByRole('combobox').selectOption('no_change');
  await page.getByRole('button', { name: 'ไทย', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  const next = page.getByRole('region', { name: 'การตรวจต่อที่แนะนำ', exact: true });
  await expect(next.getByRole('combobox').first()).toHaveValue('no_change');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: 'test-results/recommendations-thai-mobile.png', fullPage: true });
});
