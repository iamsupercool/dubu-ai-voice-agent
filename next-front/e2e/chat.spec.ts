import { test, expect, Page } from '@playwright/test';
import path from 'path';

const SS = (name: string) => path.join(__dirname, 'screenshots', `${name}.png`);

const USERNAME = 'testuser';
const PASSWORD = '1234';

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: SS(name), fullPage: true });
  console.log(`[screenshot] ${name}.png`);
}

test('dubu-voice e2e', async ({ page }) => {
  // ── 1. 회원가입 ─────────────────────────────────────────
  await page.goto('/');
  await page.getByRole('tab', { name: '회원가입' }).click();
  await page.getByLabel(/유저명/).fill(USERNAME);
  await page.getByLabel(/비밀번호/).fill(PASSWORD);
  await screenshot(page, '01-register-form');

  await page.getByRole('button', { name: '회원가입' }).click();

  // 성공 or 이미 존재 에러 중 하나가 나타날 때까지 대기
  const registerResult = await Promise.race([
    page
      .getByText('가입이 완료되었습니다')
      .waitFor({ timeout: 8_000 })
      .then(() => 'success'),
    page
      .getByRole('alert')
      .waitFor({ timeout: 8_000 })
      .then(() => 'error'),
  ]).catch(() => 'timeout');

  console.log(`[register] result: ${registerResult}`);
  await screenshot(page, '02-register-result');

  // ── 2. 로그인 후 /chat 진입 ──────────────────────────────
  await page.getByRole('tab', { name: '로그인' }).click();
  await page.getByLabel(/유저명/).fill(USERNAME);
  await page.getByLabel(/비밀번호/).fill(PASSWORD);
  await screenshot(page, '03-login-form');

  await page.getByRole('button', { name: '로그인' }).click();

  await page.waitForURL('**/chat', { timeout: 10_000 });
  await screenshot(page, '04-chat-page');

  // ── 3. 텍스트 메시지 전송 ────────────────────────────────
  const input = page.getByPlaceholder(/메시지/);
  await expect(input).toBeVisible({ timeout: 8_000 });
  await input.fill('안녕하세요');
  await screenshot(page, '05-message-typed');

  await page.keyboard.press('Enter');
  // 내 메시지가 말풍선에 표시
  await expect(page.getByText('안녕하세요').first()).toBeVisible({ timeout: 8_000 });
  await screenshot(page, '06-message-sent');

  // ── 4. AI 응답 확인 ──────────────────────────────────────
  // AI 말풍선(role=assistant) 이 뜰 때까지 대기 (최대 60초 — Ollama 응답 포함)
  const aiMessage = page.locator('[data-role="assistant"]').first();
  await expect(aiMessage).toBeVisible({ timeout: 60_000 });
  await screenshot(page, '07-ai-response');

  // ── 5. 사이드바 대화 목록 확인 ─────────────────────────
  // 10초 자동 갱신 전에 수동으로 새로고침 — conversationId 생성 이벤트로 이미 업데이트됨
  const sidebarItem = page.locator('aside button').filter({ hasText: /\S/ }).first();
  await expect(sidebarItem).toBeVisible({ timeout: 15_000 });
  await screenshot(page, '08-sidebar-conversations');

  console.log('✅ All steps passed');
});
