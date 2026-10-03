/* ============================================================
   Ameya's Library — content config
   ------------------------------------------------------------
   This is the ONLY file you should need to edit to change what
   the site says. Everything else reads from here.

   Loads as a plain <script> before app.js and declares one
   global: SECTIONS. No modules, no exports (file:// friendly).

   Hotspot coordinates are PERCENTAGES OF THE PAINTING, not the
   window. Use ?dev on the URL to drag them into place, then
   "Copy config" and paste the result over this array.
   ============================================================ */

/* The painting's true pixel size. Used for the aspect-ratio box
   that keeps hotspots locked to the art at any window size.
   If you export a new painting at a different size, change this. */
const PAINTING = {
  src: "library.png",        // full-size PNG
  width: 3840,               // exact pixel width of library.png
  height: 2160,              // exact pixel height of library.png
  alt: "A warm, lamplit room. A girl in a pale blouse stands at the left reading a book, her long hair falling over one shoulder. Behind her a stepped wooden bookshelf climbs toward the ceiling, with a monitor and a desk at the right. The words Ameya's Library are painted across the wall above the shelves."
};

/* Each section is one object on the shelf.

   id            — URL hash (#fine-art) and internal key. Lowercase, hyphens.
   label         — Heading shown in the panel and the hover label.
   object        — Which painted object this maps to. For YOUR reference only.
   hotspot       — { x, y, w, h } as percentages of the painting (0–100).
                   x,y = top-left corner. w,h = size.
                   null = no object on the painting; the section still appears
                   in the phone list and opens from its #hash.
   shape         — "rect" or "ellipse". Ellipse uses the same box as a bounding box.
   labelPosition — Where the hover label sits relative to the object:
                   "left" | "right" | "above" | "below". Pick empty shelf space.
   status        — Optional. "coming-soon" darkens the object in the room, shows
                   "Coming soon" on hover, and disables the click.
   theme         — Panel styling: "paper" | "gallery" | "spread" | "reel" | "lab" | "shelf" | "screen" | "contact"
   intro         — One or two sentences shown under the heading, in italic.
   items         — The entries in this section. Fields:
       title        — Name of the piece / project.
       description  — A sentence or paragraph.
       image        — Path under assets/. Optional (leave "" for none).
       alt          — Alt text for the image. Describe it for someone who can't see it.
       link         — Optional URL.
       linkLabel    — Text for that link, e.g. "Read the paper".
       meta         — Optional: year, collaborators, status. Shown small.
       video        — Optional YouTube or Vimeo URL ("reel" theme). Embedded lazily.
       status       — Optional. "coming-soon" stamps the item, hides its link, and
                      stops the validator nagging about a missing image.
*/
const SECTIONS = [
  {
    id: "about",
    label: "About me",
    object: "the photo frame standing in the top cubby of the shelf",
    hotspot: { x: 33.9, y: 17.6, w: 10.9, h: 14.4 },
    shape: "rect",
    labelPosition: "right",
    theme: "paper",
    intro: "",
    items: [
      {
        title: "Ameya Kohli",
        description: "I’m an artist with a foot in bioengineering, design, and studio practice. My work runs from fine art to the design of medical devices. It has been shown in more than forty exhibitions, most recently at the U.S. Capitol.",
        image: "assets/ameya.jpg",
        alt: "Ameya Kohli standing on the water with the lower Manhattan skyline behind her, long dark hair over a white top, smiling slightly.",
        link: "",
        linkLabel: "",
        meta: ""
      }
    ]
  },
  {
    id: "fine-art",
    label: "Fine art",
    object: "the portfolio book and jar of brushes standing on the second shelf",
    hotspot: { x: 34.4, y: 37.8, w: 8.7, h: 16.2 },
    shape: "rect",
    labelPosition: "right",
    theme: "gallery",
    intro: "Paintings and drawings, mostly digital, some not.",
    items: [
      {
        title: "Placeholder painting",
        description: "A description of the piece: what it is, what it was for, what you were trying to do.",
        image: "assets/example.jpg",
        alt: "Describe the painting here.",
        link: "",
        linkLabel: "",
        meta: "2026"
      }
    ]
  },
  {
    id: "graphic-design",
    label: "Graphic design",
    object: "none yet: the second shelf now holds the fine-art portfolio. Reachable from the phone list and #graphic-design until it has an object.",
    hotspot: null,
    shape: "rect",
    labelPosition: "right",
    theme: "spread",
    intro: "Posters, layouts, identities. Things meant to be printed.",
    items: [
      {
        title: "Placeholder poster",
        description: "What it was for and the idea behind it.",
        image: "assets/example.jpg",
        alt: "Describe the poster here.",
        link: "",
        linkLabel: "",
        meta: "2026"
      },
      {
        title: "Second placeholder",
        description: "Another short description.",
        image: "assets/example.jpg",
        alt: "Describe it here.",
        link: "",
        linkLabel: "",
        meta: "2025"
      }
    ]
  },
  {
    id: "animation",
    label: "Animation",
    object: "third shelf, the wide middle cubby",
    hotspot: { x: 31.7, y: 58.3, w: 48.5, h: 20.6 },
    shape: "rect",
    labelPosition: "above",
    status: "coming-soon",
    theme: "reel",
    intro: "Moving pictures. Short loops and longer pieces.",
    items: [
      {
        title: "Placeholder reel",
        description: "A sentence about the piece.",
        image: "assets/example.jpg",
        alt: "A still from the animation.",
        link: "",
        linkLabel: "",
        meta: "2026",
        video: ""
      }
    ]
  },
  {
    id: "interests",
    label: "Interests",
    object: "bottom shelf, the long low cubby",
    hotspot: { x: 31.7, y: 82.4, w: 48.2, h: 15.1 },
    shape: "rect",
    labelPosition: "above",
    status: "coming-soon",
    theme: "shelf",
    intro: "The books on the bottom shelf. Things I like that aren't work.",
    items: [
      {
        title: "Reading",
        description: "What you're reading, what you keep coming back to.",
        image: "",
        alt: "",
        link: "",
        linkLabel: "",
        meta: ""
      },
      {
        title: "Another interest",
        description: "A sentence or two.",
        image: "",
        alt: "",
        link: "",
        linkLabel: "",
        meta: ""
      }
    ]
  },
  {
    id: "projects",
    label: "Projects",
    object: "the computer on the right: monitor and stand, down to the desk",
    hotspot: { x: 84.6, y: 41.9, w: 15.4, h: 23.0 },
    shape: "rect",
    labelPosition: "below",
    theme: "screen",
    intro: "Things I have built. Click a screenshot to open it.",
    items: [
      {
        title: "Biome Guessr",
        description: "A geography guessing game played from orbit: you are dropped somewhere on a blocky, voxel Earth and have to work out where you are from the biome alone. Built in plain JavaScript with Three.js for the WebGL globe, bundled with Vite, and deployed on Vercel.",
        image: "assets/site-1.jpg",
        alt: "The Biome Guessr title screen: pixel lettering over a voxel Earth seen from space, with a Begin Mission button and a satellite readout in the corner.",
        link: "https://biomeguessr.vercel.app/",
        linkLabel: "Play it",
        meta: "2026 · browser game · 3D globe"
      },
      {
        title: "Speak.exe",
        description: "A speaking simulator. You get one unfamiliar idea, fifteen minutes to research it, and one minute to explain it from your notes, with streaks and an archive of topics you have done. Everything stays on your device. Built with Next.js and React, deployed on Vercel.",
        image: "assets/site-2.jpg",
        alt: "The Speak.exe home page: a retro window titled Learn it fast, say it clearly, with a Start Challenge button and a sealed card for today’s topic.",
        link: "https://speak-exe.vercel.app/",
        linkLabel: "Try it",
        meta: "2026 · web app"
      }
    ]
  },
  {
    id: "contact",
    label: "Contact",
    object: "none yet: the monitor holds Projects. Reachable from the phone list and #contact.",
    hotspot: null,
    shape: "rect",
    labelPosition: "below",
    theme: "contact",
    intro: "Say hello. The monitor is always on.",
    items: []       /* Contact content comes from CONTACT below, not from items. */
  }
];


/* ---------- Contact (step 8) ----------
   Rendered by the "contact" theme as one small card.
   The email is split so it never appears whole in the HTML; app.js joins
   the two halves at click time. Light scraper protection, nothing more. */
const CONTACT = {
  emailUser: "ameyakohli0",        // the part before the @
  emailDomain: "gmail.com",        // the part after the @
  linkedin: "https://www.linkedin.com/in/REPLACE-ME",
  instagram: "https://www.instagram.com/REPLACE-ME",
  resume: "assets/resume.pdf"      // top-level resume: drop the PDF in assets/ and name it here. Leave "" for none.
};
