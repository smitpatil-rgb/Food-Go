# Upload Food.Go to GitHub

## Using Git (recommended)

1. Extract the ZIP and open its inner `Food.Go` folder, where `package.json` and `.gitignore` are located.
2. Create a new **empty** repository on GitHub. Do not initialize another README, license, or `.gitignore`. Choose private visibility until you have checked image rights and publication details.
3. Open a terminal in that `Food.Go` folder:

   ```sh
   git init -b main
   git add .
   git status --short
   ```

4. Inspect the staged files. `.env`, `node_modules`, `.next`, and credentials must not appear. The blank `.env.example`, lockfile, and `.github/workflows/ci.yml` should appear.
5. Commit and push, replacing the example remote with your repository URL:

   ```sh
   git commit -m "Initial Food.Go application"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```

   Git may ask you to configure your name/email or sign in. Do that locally; never save access tokens or passwords in source files. Git includes hidden project files unless they are ignored.

6. Open the repository's **Actions** tab and check the first `Food.Go checks` run. It tests with a disposable PostgreSQL database. The workflow has not run on your account until you push it.

## Using Upload files instead

Upload the extracted project contents into the repository root, not an extra nested folder and not the ZIP by itself. Include `.github`, `.gitignore`, `.gitattributes`, `.editorconfig`, `.env.example`, and `.nvmrc`; file pickers can miss dotfiles. Git is preferred to preserve the complete layout.

## Before making it public

- Check for credentials, personal details, and customer data.
- Confirm redistribution rights for every supplied image. See `ASSET_NOTES.md`.
- Replace demonstration business claims with verified information for real restaurant use.
- Choose a license only after confirming ownership; no license was added automatically.
- Enable private vulnerability reporting in the repository settings if desired.

GitHub stores/tests the source; publishing it does not deploy a live website. GitHub Pages is static hosting and cannot run this app's server routes or PostgreSQL database. A live deployment requires a Next.js-capable host and PostgreSQL. No remote repository or paid service was created during preparation.
