# WebPlayroom

## Project Description

WebPlayroom is a browser-based mini-game hub built with React. The home page links to Snake, 8-Ball Pool, Connect 4, Buckshot Roulette Lite Plus, and Country Quest. Country Quest currently has a difficulty selector; gameplay for the five games is still in development.

## Installation

Install Node.js 24.15 or later on the 24.x line and npm, then clone the repository and install its dependencies:

```sh
git clone https://github.com/cis3296-f26/WebPlayroom.git
cd WebPlayroom
npm ci --include=optional
```

## Build

Create the production build:

```sh
npm run build
```

The built site is placed in `dist/`.

## Run

To start the development server:

```sh
npm run dev
```

To run the production build locally after building it:

```sh
npm run preview
```

Open the URL printed in the terminal. Select a game on the home page to open its page, and select the WebPlayroom title to return home.
