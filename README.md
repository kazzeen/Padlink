
<img width="2528" height="1696" alt="logo" src="https://github.com/user-attachments/assets/54337324-7cee-4509-879c-8195ce455b7b" />


This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Assets & Branding

### Logo Implementation
The company logo is located at `public/images/logo_transparent.png`.

**Usage Guidelines:**
- **File Path:** `/images/logo_transparent.png` (accessible via the public directory).
- **Component:** Use the Next.js `<Image />` component for automatic optimization.
- **Dimensions:** The logo is square. Recommended display size is `32x32` for headers/navbars.
- **Styling:** Use `rounded-full` class for the standard circular presentation.
- **Accessibility:** Always provide descriptive `alt` text (e.g., "PadLink Logo - Connect with compatible roommates").

**Example Usage:**
```tsx
import Image from "next/image";

<Image 
  src="/images/logo_transparent.png" 
  alt="PadLink Logo" 
  width={32} 
  height={32} 
  className="rounded-full object-cover"
/>
```

**Optimization:**
The source file is optimized (~50KB) to ensure fast loading times and minimal bandwidth usage. Next.js further optimizes this image for production serving.

### Icon Styling (Glass Morphic)
All icon logos (Brand, Navigation, Functional UI) use a consistent glass morphic styling system.

**Class Usage:**
Use the `.glass-icon-container` utility class wrapper around your icon or image.

```tsx
<div className="glass-icon-container w-10 h-10 rounded-full">
  {/* Your Icon SVG or Image here */}
</div>
```

**Features:**
- **Background:** Semi-transparent (25% opacity)
- **Blur:** 10px backdrop filter
- **Border:** 1px solid white (50% opacity)
- **Shadow:** Soft inner shadow
- **Dark Mode:** Automatically adjusts to dark theme
- **Fallbacks:** Solid background for browsers without `backdrop-filter` support

**Performance & Accessibility:**
- Uses hardware-accelerated CSS properties.
- Maintains 3:1 contrast ratio via background opacity adjustments.
- Minimal render time (<10ms).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
