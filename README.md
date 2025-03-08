# Physics-Based Character Controller

A simple physics-based character controller using Rapier physics engine and Three.js for rendering. This project demonstrates how to create a character that responds to WASD movement and space for jumping, with realistic physics simulation.

## Features

- Physics-based character movement with WASD controls
- Jumping with space bar
- Capsule collider for the character
- Ground collision detection
- 3D rendering with Three.js
- Orbit camera controls

## Controls

- **W**: Move forward
- **A**: Move left
- **S**: Move backward
- **D**: Move right
- **Space**: Jump
- **Mouse**: Rotate camera

## Technologies Used

- [Three.js](https://threejs.org/) - 3D rendering
- [Rapier](https://rapier.rs/) - Physics simulation
- [Vite](https://vitejs.dev/) - Development server and bundler

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository or download the source code
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

### Running the Application

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000` (or the URL shown in your terminal).

## Project Structure

- `index.html` - Main HTML file
- `src/` - Source code directory
  - `main.js` - Entry point
  - `physics.js` - Rapier physics setup
  - `character.js` - Character controller
  - `input.js` - Input handling
  - `scene.js` - Three.js scene setup

## Deployment

This project is set up for easy deployment to Netlify. Simply connect your GitHub repository to Netlify, and it will automatically build and deploy the site.

## How It Works

1. The physics world is initialized with Rapier
2. A ground plane and character capsule are created in both the physics world and the 3D scene
3. Input from WASD and space is captured and converted to movement directions
4. The character controller applies forces or velocities to the physics body based on input
5. The 3D mesh positions are updated based on the physics simulation
6. The camera follows the character

## License

This project is licensed under the MIT License - see the LICENSE file for details.