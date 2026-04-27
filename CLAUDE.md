# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SVG geometry animation for a Chinese math problem involving a rotating triangle inside a square. Single-page HTML application with embedded SVG and JavaScript — no build tools or dependencies.

## Geometry Problem Specification

- Square ABCD with diagonal BD = 6 (side length = 3√2 ≈ 4.2426)
- P on segment BD with BP = 1; Q on segment BC with ∠BPQ = 90° (BP = PQ = 1)
- Triangle BPQ rotates clockwise around B by n° (0→360) to become triangle BMN
- E is the midpoint of ND; line CE is drawn
- **Key result**: E traces a circle centered at the square's center (s/2, s/2) with radius √2/2

## Coordinate System

SVG coordinates (y-axis points down):
- A = (0, 0) top-left, B = (0, s) bottom-left, C = (s, s) bottom-right, D = (s, 0) top-right
- P = (1/√2, s − 1/√2) ≈ (0.707, 3.536)
- Q = (√2, s) ≈ (1.414, 4.243)
- Clockwise rotation in SVG = positive angle in the standard 2D rotation formula

## Running

Open `index.html` directly in a browser. No server required.

## Architecture

- **Static SVG elements**: square, diagonal BD, locus circles, original triangle BPQ, right-angle marker
- **Dynamic elements** (updated per frame via `requestAnimationFrame`): rotating triangle BMN, line ND, line CE, point E, angle arc, E trail arc, dynamic labels
- **Controls**: play/pause button, reset button, angle slider, keyboard (Space, Arrow keys)
