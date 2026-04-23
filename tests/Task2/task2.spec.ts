import { test, expect } from '../../fixtures/allFixtures';

test.describe.only('test task 2', async () => {

    test('test', async ({ tablePage }) => {

        let row1 : any;

        await test.step('open table page', async () => {

            await tablePage.openTablePage();
        });

        await test.step("locate the row", async () => {


             row1 = tablePage.tableRow1Locator;



        });

        await test.step("check whether the 10% text is visible in the row", async () => {
 

                await expect(row1.getByText("10%")).toBeVisible();
            })

    });





});