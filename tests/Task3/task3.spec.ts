import {expect, test} from '../../fixtures/allFixtures';
import { GeneralComponentPage } from '../../pages/commitQuality/generalComponent.page';

test.describe('Test suite 1', () => {

    test('Open General Component Page', async ({generalComponentPage}) => {

        await generalComponentPage.openGeneralComponentPage();
        await expect(generalComponentPage.page).toHaveURL("https://commitquality.com/practice-general-components");

    });
    test('Click on Back to practice button', async ({generalComponentPage}) => {

        await generalComponentPage.openGeneralComponentPage();

        await generalComponentPage.backToPracticeButton.click();
        await expect(generalComponentPage.page).toHaveURL("https://commitquality.com/practice");
    });

    

});

test.describe('Test suite 2', () => {

    test('Open general component page and click on back to practice button', async ({generalComponentPage}) => {

        await test.step('Open general component Page', async () => {

            await generalComponentPage.openGeneralComponentPage();
            await expect(generalComponentPage.page).toHaveURL("https://commitquality.com/practice-general-components");
        });

        await test.step('Click on Back to practice button', async () => {
            await generalComponentPage.backToPracticeButton.click();
            expect(generalComponentPage.page).toHaveURL("https://commitquality.com/practice");
        });

    });
});