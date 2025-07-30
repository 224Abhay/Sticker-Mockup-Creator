# 🎨 Sticker Mockup Creator

A powerful web application for creating professional sticker mockups with customizable measurement lines and precise positioning.

🌐 **[Live Demo](https://224abhay.github.io/Sticker-Mockup-Creator/)** - Try it out now!

![Sticker Mockup Creator](https://img.shields.io/badge/React-18.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.0-purple?style=for-the-badge&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![Deploy Status](https://img.shields.io/github/actions/workflow/status/224Abhay/sticker-mockup-creator/deploy.yml?branch=main&label=Deploy&style=for-the-badge)

## ✨ Features

### 🖼️ **Multi-Size Background Support**
- Upload backgrounds for Small (4cm), Medium (6cm), and Large (10cm) sizes
- Independent positioning for each background size
- Clean tabbed interface for easy management

### 🏷️ **Advanced Sticker Management**
- Upload multiple stickers simultaneously
- Scrollable sticker gallery with preview thumbnails
- Easy sticker removal with hover controls
- Transparent background handling for professional results

### 📏 **Professional Measurement Lines**
- **Toggle Control**: Enable/disable measurement lines
- **Customizable Styling**: 
  - Line width (1-50px)
  - Font size (12-200px)
  - Distance from sticker (20-200px)
  - Line length (50-150% of sticker size)
  - Color selection (White, Black, Red, Green, Blue, Yellow)
  - End styles (Perpendicular lines or Arrow heads)
- **Live Preview**: See measurement lines in real-time
- **Smart Positioning**: Automatically places lines on the longer dimension

### 🎯 **Precise Sticker Positioning**
- Drag and drop sticker positioning
- Square aspect ratio maintenance
- Real-time position and size display
- Independent positioning for each background size
- Content-aware scaling (ignores transparent areas)

### 📱 **Responsive Design**
- Works on desktop, tablet, and mobile devices
- Adaptive layout for different screen sizes
- Touch-friendly controls

### 💾 **Batch Export**
- Generate multiple mockups simultaneously
- Descriptive filenames: `{sticker_name}-{background_name}-{size}.png`
- High-quality PNG output
- Automatic download of all generated mockups

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm, yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/224Abhay/sticker-mockup-creator.git
   cd sticker-mockup-creator
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🚀 Deployment

This project is automatically deployed to GitHub Pages. The live demo is available at:
**https://224abhay.github.io/sticker-mockup-creator/**

### Manual Deployment
If you want to deploy manually:

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages**
   - Go to your repository settings
   - Navigate to "Pages" section
   - Set source to "GitHub Actions"
   - Push to main branch to trigger automatic deployment

## 🛠️ Usage

### 1. **Upload Backgrounds**
   - Click on the "Small", "Medium", or "Large" tabs
   - Upload background images for each size
   - Backgrounds are hidden once uploaded for a clean interface

### 2. **Add Stickers**
   - Upload one or multiple sticker images
   - Stickers appear in a scrollable gallery
   - Remove unwanted stickers with the hover delete button

### 3. **Position Stickers**
   - Select a background tab to see the preview
   - Drag the purple box to position your sticker
   - Resize from the bottom-right corner
   - View real-time position and size coordinates

### 4. **Customize Measurement Lines**
   - Toggle measurement lines on/off
   - Adjust line width, font size, and distance
   - Choose line length as percentage of sticker size
   - Select end style (perpendicular lines or arrows)
   - Pick from 6 color options

### 5. **Generate Mockups**
   - Review the total number of mockups to be generated
   - Click "Generate Mockups" to create all combinations
   - Files are automatically downloaded with descriptive names

## 🎨 Customization

### Measurement Line Settings
- **Line Width**: 1-50px range
- **Font Size**: 12-200px range  
- **Distance**: 20-200px from sticker
- **Line Length**: 50-150% of sticker dimensions
- **End Style**: Perpendicular lines or Arrow heads
- **Colors**: White, Black, Red, Green, Blue, Yellow

### File Naming Convention
Generated files follow the pattern:
```
{sticker_name}-{background_name}-{size}.png
```
Example: `my-logo-wooden-table-small.png`

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Shadcn/ui component library
- **Icons**: Lucide React
- **State Management**: React Hooks
- **File Handling**: HTML5 File API
- **Canvas Operations**: HTML5 Canvas API

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                 # Shadcn/ui components
│   ├── BackgroundPanel.tsx # Background upload and management
│   ├── StickerPanel.tsx    # Sticker upload and gallery
│   ├── PreviewPanel.tsx    # Sticker positioning and preview
│   ├── FileUpload.tsx      # Reusable file upload component
│   └── MockupCreator.tsx   # Main application component
├── pages/
│   ├── Index.tsx           # Main page
│   └── NotFound.tsx        # 404 page
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
└── assets/                 # Static assets
```

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Lucide](https://lucide.dev/) for the excellent icon set
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Vite](https://vitejs.dev/) for the fast build tool

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Review the documentation above

---

**for creators who need professional sticker mockups**
