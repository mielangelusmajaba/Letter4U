/* ============================================================
   ✏️  CONSTELLATION OF US — YOUR EDITABLE CONTENT
   ------------------------------------------------------------
   This is the only file you need to edit.
   - Change any text inside the quotes "like this".
   - Photos: put them in the /images folder named Pic-1 … Pic-5.
     .png, .jpg, .jpeg and .webp all work (the extension is found automatically).
     If a photo is missing, a cute emoji shows instead.
   - Quiz "answer" is the POSITION of the correct option,
     counting from 0  →  first option = 0, second = 1, third = 2, fourth = 3.
     For several correct options use a list, e.g. answer: [2, 3].
   - Please keep exactly 5 constellations (the sky is laid out for 5).
   - You don't need to touch "points" / "path" (those draw the star shapes).
   ============================================================ */

const CONFIG = {
  herName: "My Love",          // ✏️ her name or nickname (shown on the start screen)
  fromName: "Miel:)",       // ✏️ your name (signed at the end of the letter)

  intro: {
    title: "Constellation of Us",
    subtitle:
      "Every star up here holds a little piece of us. Answer a question, connect the stars, and see what the sky remembers. 💫",
    button: "Begin ✨",
  },

  // ✏️ THE LETTER — each item in "body" is one paragraph.
  letter: {
    greeting: "Dear My Love,",
    body: [
      "Happy birthday my loveskoo!! I think malalate na masend tong mini project ko, I try to perfect what i want to do, that i often get stuck in planning or in thinking, I guess that reflects what I am.",
      "Im sorry din love kung palpak nanaman ako this birthday, kailangan ko na mag mature and ihandle ko na yung buhay ko, yung mga decisions ko. I just know that you are the one, love, the person that I will share and live my life with, hanggang sa susunod pa na yugto, and I don't want to lose you or even think of losing you, and now that's why I have to strengthen my resolve. I love you, love.",
      "I love you. I'm just a boy that is in love with you, and now I have to be a man to really make you feel safe and loved. I'm on my way there, na love. I love you, forever, mas higit pa sa infinity.",
    ],
    signoff: "Forever yours,",
  },

  constellations: [
    {
      name: "The Heart",
      quiz: {
        q: "Where did we have our very first date?",           // ✏️
        options: ["School Canteen", "Chowking", "Intramuros", "May first date tayo?"],
        answer: 1,                                             // ✏️ index of correct option
      },
      memory: {
        photo: "images/Pic-1",                                 // ✏️
        caption: "our very first date sa BGC Chowking, dito ata nanggaling yung infamous pic natin, kasi naka black ka and pe ako huhu.",
        date: "September 21, 2024",                            // ✏️
        emoji: "💗",                                           // shown if photo is missing
      },
      points: [[0, 0.5], [-0.45, 0.9], [-0.95, 0.55], [-0.85, 0], [-0.45, -0.45], [0, -0.95],
               [0.45, -0.45], [0.85, 0], [0.95, 0.55], [0.45, 0.9]],
      path: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
    },
    {
      name: "Our Moon",
      quiz: {
        q: "What's my favourite thing to do with you?",         // ✏️
        options: ["Late-night talks", "Eating good food", "Watching movies", "Literally anything"],
        answer: 3,
      },
      memory: {
        photo: "images/Pic-2",
        caption: "ako target ng mga lamok sa ulo ko huhu",
        date: "March 1, 2025",
        emoji: "🌙",
      },
      points: [[0.64, 0.77], [-0.17, 0.98], [-0.87, 0.5], [-0.87, -0.5], [-0.17, -0.98], [0.64, -0.77],
               [0.15, -0.45], [-0.05, 0], [0.15, 0.45]],
      path: [0, 1, 2, 3, 4, 5, 6, 7, 8, 0],
    },
    {
      name: "The Flower",
      quiz: {
        q: "Which song is 'our song'?",                         // ✏️
        options: ["Lapit", "Pwede Ka Ba?", "Pagibig ng ikaw at ako", "Still deciding"],
        answer: [2, 3],                                        // two correct answers
      },
      memory: {
        photo: "images/Pic-3",
        caption: "A Sunflower to my sunflower<3",
        date: "May 19, 2025",
        emoji: "🌷",
      },
      points: [[0, -1], [0, -0.15], [-0.55, 0.15], [-0.6, 0.8], [-0.25, 0.5], [0, 0.95],
               [0.25, 0.5], [0.6, 0.8], [0.55, 0.15], [0.55, -0.45], [0, -0.65]],
      path: [0, 10, 9, 1, 2, 3, 4, 5, 6, 7, 8, 1],
    },
    {
      name: "The Key",
      quiz: {
        q: "Who said “I love you” first?",                      // ✏️
        options: ["You did", "I did", "We said it at the same time", "Basta nagmamahalan tayo"],
        answer: [0, 1, 2, 3],                                  // all options are correct
      },
      memory: {
        photo: "images/Pic-4",
        caption: "our intramuros date, it was a surreal experience from me, so much so na namula yung kamay ko sa holding hands",
        date: "October 12, 2024",
        emoji: "🗝️",
      },
      points: [[-0.95, 0.3], [-0.62, 0.65], [-0.3, 0.3], [-0.62, -0.05], [0.95, 0.3], [0.95, -0.15],
               [0.65, -0.15], [0.65, 0.3]],
      path: [2, 1, 0, 3, 2, 4, 5, 6, 7],
    },
    {
      name: "Infinity",
      quiz: {
        q: "How long am I going to love you?",                  // ✏️
        options: ["A day", "A year", "Forever", "Even longer than forever"],
        answer: 3,
      },
      memory: {
        photo: "images/Pic-5",
        caption: "I love you, across all of our lifetimes and our lives after that, I will find you in every reincarnation or I will stay with you in heaven, kahit saan, just to be with you.",
        date: "December 11, 2023",
        emoji: "♾️",
      },
      points: [[1, 0], [0.6, 0.57], [0.16, 0.25], [-0.16, -0.25], [-0.6, -0.57], [-1, 0],
               [-0.6, 0.57], [-0.16, 0.25], [0.16, -0.25], [0.6, -0.57]],
      path: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
    },
  ],
};
