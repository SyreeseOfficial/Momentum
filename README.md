# Momentum

Momentum is a minimalist habit tracking and productivity application built with React Native and Expo. It helps you stay consistent with your daily goals by providing a simple, intuitive interface to track your progress, view your history, and analyze your performance.

## Features

-   **Daily Trackers**:  Create and manage custom trackers for any habit or goal (e.g., "Drink Water", "Read 30 mins").
-   **Goal Setting**: Set daily targets for each tracker.
-   **Progress History**:  View a history of your daily activity to see your streaks and consistency.
-   **Statistics**:  Visualize your progress with helpful stats and insights.
-   **Notifications**:  Set daily reminders to keep you on track.
-   **Haptic Feedback**:  Satisfying tactile feedback when interacting with trackers.
-   **Local Storage**:  Your data is stored locally on your device for privacy and offline access.

## Tech Stack

-   **Framework**: [Expo](https://expo.dev/) (SDK 54) & [React Native](https://reactnative.dev/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/)
-   **Storage**: `@react-native-async-storage/async-storage`
-   **Icons**: `@expo/vector-icons`
-   **Notifications**: `expo-notifications`

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (LTS recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
-   [Expo Go](https://expo.dev/client) app on your iOS or Android device (for physical device testing)

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/SyreeseOfficial/Momentum.git
    cd Momentum
    ```

2.  Install dependencies:

    ```bash
    npm install
    # or
    yarn install
    ```

### Running the App

Start the development server:

```bash
npx expo start
```

-   **Android**: Press `a` in the terminal (requires Android Studio/Emulator) or scan the QR code with Expo Go.
-   **iOS**: Press `i` in the terminal (requires Xcode/Simulator) or scan the QR code with the Camera app (if logged into Expo).
-   **Web**: Press `w` in the terminal.

## Project Structure

```
Momentum/
├── app/                 # Expo Router app directory (screens & navigation)
│   ├── (tabs)/          # Tab navigation layout
│   │   ├── index.tsx    # Home/Tracker screen
│   │   ├── history.tsx  # History screen
│   │   ├── stats.tsx    # Statistics screen
│   │   └── settings.tsx # Settings screen
│   └── ...
├── src/                 # Source code
│   ├── components/      # Reusable UI components
│   ├── constants/       # App constants (theme, colors)
│   ├── context/         # React Context (State management)
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions (storage, date logic)
└── ...
```

## Contributing

Contributions are welcome! If you have any ideas, suggestions, or bug reports, please open an issue or submit a pull request.

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourFeature`).
3.  Commit your changes (`git commit -m 'Add some feature'`).
4.  Push to the branch (`git push origin feature/YourFeature`).
5.  Open a Pull Request.

## License

This project is licensed under the MIT License.
