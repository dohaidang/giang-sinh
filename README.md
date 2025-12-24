# 🎄 Magic Christmas - Interactive 3D Experience

A beautiful interactive 3D Christmas experience powered by Three.js and MediaPipe Hand Tracking. Control the scene with hand gestures to create magical Christmas effects!

## ✨ Features

- **🎨 Interactive 3D Scene**: Beautiful particle-based Christmas tree with golden sparkles, red lights, and gift boxes
- **🖐️ Hand Gesture Control**: 
  - ✊ **Fist**: Form Christmas tree
  - 🖐️ **Open Hand**: Explode particles and view photos
  - 🫶 **Heart Gesture**: Create a heart shape with two hands
  - 👌 **Pinch**: Zoom into photos
- **📸 Photo Gallery**: View 5 photos in 3D space
- **🎵 Background Music**: Festive Christmas music
- **📱 Responsive Design**: Works on desktop and mobile devices
- **⚡ Loading Screen**: Beautiful loading animation with progress tracking
- **🛡️ Error Handling**: Graceful error handling for camera and library loading

## 🚀 Live Demo

Visit the live site: [https://dohaidang.github.io/merry-christmas/](https://dohaidang.github.io/merry-christmas/)

## 🛠️ Technologies Used

- **Three.js** - 3D graphics rendering
- **MediaPipe Hands** - Hand tracking and gesture recognition
- **HTML5 Canvas** - Custom texture generation
- **Web Audio API** - Background music playback

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/dohaidang/merry-christmas.git
cd merry-christmas
```

2. Open `index.html` in a web browser or use a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server . -p 8080
```

3. Open `http://localhost:8000` (or your chosen port) in your browser

## 🎮 How to Use

1. Click **"START MAGIC"** button to begin
2. Allow camera access when prompted
3. Use hand gestures to interact:
   - **Fist** 👊: Form the Christmas tree
   - **Open Hand** 🖐️: Explode particles and orbit photos
   - **Two Hands Heart** 🫶: Create a heart shape
   - **Pinch** 👌: Zoom into the selected photo
4. Move your hand left/right to rotate the scene

## 📁 Project Structure

```
merry-christmas/
├── index.html          # Main HTML file
├── audio.mp3          # Background music
├── image1-5.jpeg      # Photo gallery images
├── README.md          # This file
└── .nojekyll          # GitHub Pages configuration
```

## 🎨 Customization

You can customize the experience by modifying the `CONFIG` object in `index.html`:

```javascript
const CONFIG = {
    goldCount: 2000,        // Number of gold particles
    redCount: 300,         // Number of red light particles
    giftCount: 150,        // Number of gift box particles
    explodeRadius: 65,     // Explosion radius
    photoOrbitRadius: 25,  // Photo orbit radius
    treeHeight: 70,        // Tree height
    treeBaseRadius: 35     // Tree base radius
};
```

## 🌐 Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (with camera support)

**Note**: Camera access requires HTTPS or localhost for security reasons.

## 📝 License

This project is open source and available for personal use.

## 👤 Author

**dohaidang**

- GitHub: [@dohaidang](https://github.com/dohaidang)

## 🙏 Acknowledgments

- Three.js community
- MediaPipe team
- All contributors and testers

---

Made with ❤️ for Christmas 2025
