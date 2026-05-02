# Dreamy

A beautiful, lightweight social media frontend with a pastel aesthetic, light/dark theme toggle, and responsive design, designed for Coziness with a Low-Bloated Layout.

## ✨ Features

- **Pastel Design System**: Soft, modern color palette that's easy on the eyes
- **Light/Dark Theme Toggle**: Switch between themes with sun/moon icons
- **Responsive Layout**: Works on mobile devices and desktop
- **Performance Optimized**: Lightweight for lower-end devices
- **Accessible**: Proper focus states, ARIA labels, and semantic HTML
- **Post Borders**: Visual accent borders around posts for better separation
- **Modern Tech Stack**: Built with React, Vite, and React Router

## 🎨 Design Improvements

- Custom pastel color scheme with coordinated accent colors
- Smooth hover and focus transitions
- Consistent spacing and border radius usage
- Updated typography for better readability
- Theme-aware components (buttons, inputs, cards, forms, navbars)
- Sun/moon theme toggle icons in the navbar

## 🛠️ Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 8
- **Routing**: React Router DOM 7
- **Styling**: CSS with CSS Variables for theming
- **State Management**: React Context (Auth & Theme)
- **HTTP Client**: Axios
- **Database**: PostgreSQL (Locally Hosted)

## 📦 Installation & Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/velo4705/dbms-project.git
   cd dbms-project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173` (or another port if 5173 is in use).

4. For network access (to test on mobile devices):
   ```bash
   npm run dev
   ```
   Then use the network URL shown in the terminal (e.g., `http://192.168.x.x:5173`).

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to a GitHub repository.
2. Import the project in Vercel.
3. Vercel will auto-detect the Vite project and set:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Click Deploy and get your live URL.

### GitHub Pages
1. Update `vite.config.js` with the correct base:
   ```js
   export default defineConfig({
     base: '/<REPO_NAME>/',
     plugins: [react()],
   });
   ```
2. Build the project:
   ```bash
   npm run build
   ```
3. Deploy the `dist` folder to the `gh-pages` branch:
   ```bash
   # Using the gh-pages package (recommended)
   npm i -D gh-pages
   # Add to package.json scripts:
   # "predeploy": "npm run build",
   # "deploy": "gh-pages -d dist"
   npm run deploy
   ```
4. In GitHub Settings → Pages, set the source to the `gh-pages` branch.

## 📱 Mobile Testing

To test on your phone:
1. Ensure your computer and phone are on the same Wi-Fi network.
2. Start the dev server: `npm run dev`
3. Find your computer's local IP address (e.g., `192.168.1.12`).
4. Use the network URL shown in the terminal (e.g., `http://192.168.1.12:5173`).
5. Open that URL in your phone's browser.

## 🎯 Future Improvements

- Add animations and micro-interactions
- Implement lazy loading for images
- Add offline capabilities with service workers
- Enhance accessibility with more ARIA attributes
- Add unit and integration tests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by modern social media interfaces
- Built with ❤️ using Vite and React
- Pastel color palette inspired by soft, calming designs