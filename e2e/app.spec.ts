import { test, expect } from '@playwright/test'
import { captureScreenshot } from './helpers'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function addTodo(page: import('@playwright/test').Page, text: string) {
  await page.getByTestId('todo-input').fill(text)
  await page.getByTestId('todo-input').press('Enter')
}

// ── Test Suite ────────────────────────────────────────────────────────────────

test.describe('DarkTodo App', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and clear localStorage for a clean slate before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  // 1. Add a todo
  test('happy path — add a todo', async ({ page }) => {
    await page.getByTestId('todo-input').fill('Buy groceries')
    await page.getByTestId('todo-input').press('Enter')

    // Todo appears in list
    await expect(page.getByTestId('todo-item')).toHaveCount(1)
    await expect(page.getByTestId('todo-text').first()).toHaveText('Buy groceries')

    // Checkbox is unchecked
    await expect(page.getByTestId('todo-checkbox').first()).not.toBeChecked()

    // Active count is shown
    await expect(page.getByTestId('active-count')).toContainText('1 item')
  })

  // 2. Complete a todo
  test('happy path — complete a todo', async ({ page }) => {
    await addTodo(page, 'Walk the dog')

    // Verify active count is 1
    await expect(page.getByTestId('active-count')).toContainText('1 item')

    // Click checkbox to complete
    await page.getByTestId('todo-checkbox').first().click()

    // Text should have line-through
    await expect(page.getByTestId('todo-text').first()).toHaveCSS('text-decoration-line', 'line-through')

    // Active count decrements to 0
    await expect(page.getByTestId('active-count')).toContainText('0 items')
  })

  // 3. Delete a todo
  test('happy path — delete a todo', async ({ page }) => {
    await addTodo(page, 'Read a book')

    await expect(page.getByTestId('todo-item')).toHaveCount(1)

    // Hover to reveal the delete button, then click
    const todoItem = page.getByTestId('todo-item').first()
    await todoItem.hover()
    await page.getByTestId('delete-button').first().click()

    // Todo is removed
    await expect(page.getByTestId('todo-item')).toHaveCount(0)
  })

  // 4. Filter todos
  test('happy path — filter todos', async ({ page }) => {
    await addTodo(page, 'Active task 1')
    await addTodo(page, 'Active task 2')
    await addTodo(page, 'Will be completed')

    // Complete the third todo
    const checkboxes = page.getByTestId('todo-checkbox')
    await checkboxes.nth(2).click()

    // All filter: 3 items
    await page.getByTestId('filter-all').click()
    await expect(page.getByTestId('todo-item')).toHaveCount(3)

    // Active filter: 2 items
    await page.getByTestId('filter-active').click()
    await expect(page.getByTestId('todo-item')).toHaveCount(2)
    const activeTexts = await page.getByTestId('todo-text').allTextContents()
    expect(activeTexts).not.toContain('Will be completed')

    // Completed filter: 1 item
    await page.getByTestId('filter-completed').click()
    await expect(page.getByTestId('todo-item')).toHaveCount(1)
    await expect(page.getByTestId('todo-text').first()).toHaveText('Will be completed')

    // Back to All: 3 items
    await page.getByTestId('filter-all').click()
    await expect(page.getByTestId('todo-item')).toHaveCount(3)
  })

  // 5. Clear completed
  test('happy path — clear completed', async ({ page }) => {
    await addTodo(page, 'Keep me')
    await addTodo(page, 'Complete 1')
    await addTodo(page, 'Complete 2')

    // Complete the 2nd and 3rd todos
    const checkboxes = page.getByTestId('todo-checkbox')
    await checkboxes.nth(1).click()
    await checkboxes.nth(2).click()

    // Click Clear Completed
    await page.getByTestId('clear-completed').click()

    // Only active todo remains
    await expect(page.getByTestId('todo-item')).toHaveCount(1)
    await expect(page.getByTestId('todo-text').first()).toHaveText('Keep me')
  })

  // 6. Edge case — empty input
  test('edge case — empty input does not add todo', async ({ page }) => {
    // Try submitting empty input
    await page.getByTestId('todo-input').fill('')
    await page.getByTestId('todo-input').press('Enter')
    await expect(page.getByTestId('todo-item')).toHaveCount(0)

    // Try submitting whitespace-only
    await page.getByTestId('todo-input').fill('   ')
    await page.getByTestId('add-button').click()
    await expect(page.getByTestId('todo-item')).toHaveCount(0)
  })

  // 7. Edge case — empty state message
  test('edge case — empty state message shown when no todos match filter', async ({ page }) => {
    // No todos at all: empty state shown
    await expect(page.getByTestId('empty-state')).toBeVisible()

    // Add a todo and switch to Completed filter (no completed tasks)
    await addTodo(page, 'Active task')
    await page.getByTestId('filter-completed').click()

    await expect(page.getByTestId('empty-state')).toBeVisible()
    await expect(page.getByTestId('empty-state')).toContainText('No completed todos yet.')
  })

  // 8. Data persistence — todos survive refresh
  test('data persistence — todos survive page refresh', async ({ page }) => {
    await addTodo(page, 'Persist me')
    await addTodo(page, 'Also persist me')

    // Complete the first todo
    await page.getByTestId('todo-checkbox').first().click()

    // Refresh the page
    await page.reload()

    // Both todos still present
    await expect(page.getByTestId('todo-item')).toHaveCount(2)

    // First todo still completed (line-through)
    const firstText = page.getByTestId('todo-text').first()
    await expect(firstText).toHaveCSS('text-decoration-line', 'line-through')

    // Second todo still active (no line-through)
    const secondText = page.getByTestId('todo-text').nth(1)
    await expect(secondText).not.toHaveCSS('text-decoration-line', 'line-through')
  })

  // 9. Data persistence — dark mode survives refresh
  test('data persistence — dark mode survives page refresh', async ({ page }) => {
    // Toggle dark mode on
    await page.getByTestId('dark-mode-toggle').click()

    // Verify dark mode is applied
    await expect(page.locator('html')).toHaveClass(/dark/)

    // Refresh the page
    await page.reload()

    // Dark mode should still be active
    await expect(page.locator('html')).toHaveClass(/dark/)
  })
})

// ── Screenshot captures (separate describe to run independently) ───────────────

test.describe('Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('screenshot — light mode with mixed todos', async ({ page }) => {
    await addTodo(page, 'Buy groceries')
    await addTodo(page, 'Walk the dog')
    await addTodo(page, 'Read a book')
    await addTodo(page, 'Write tests')

    // Complete 2nd and 4th todos
    const checkboxes = page.getByTestId('todo-checkbox')
    await checkboxes.nth(1).click()
    await checkboxes.nth(3).click()

    await page.getByTestId('filter-all').click()
    await captureScreenshot(page, 'light-mode-main')
  })

  test('screenshot — dark mode with mixed todos', async ({ page }) => {
    await addTodo(page, 'Buy groceries')
    await addTodo(page, 'Walk the dog')
    await addTodo(page, 'Read a book')
    await addTodo(page, 'Write tests')

    const checkboxes = page.getByTestId('todo-checkbox')
    await checkboxes.nth(1).click()
    await checkboxes.nth(3).click()

    // Toggle dark mode
    await page.getByTestId('dark-mode-toggle').click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await captureScreenshot(page, 'dark-mode-main')
  })

  test('screenshot — empty state', async ({ page }) => {
    // Add a todo but don't complete it, switch to Completed filter
    await addTodo(page, 'Active only')
    await page.getByTestId('filter-completed').click()

    await expect(page.getByTestId('empty-state')).toBeVisible()
    await captureScreenshot(page, 'empty-state')
  })

  test('screenshot — mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await addTodo(page, 'Mobile task 1')
    await addTodo(page, 'Mobile task 2')

    await captureScreenshot(page, 'mobile-view')
  })
})
