// Everything on the scrapbook, one entry per card. Kinds: song, photo, video, film, book, pin.
// Captions may contain simple HTML (<em>, &mdash;).
const ITEMS = [
  {
    "kind": "song",
    "title": "I Can't Get My Head Around You",
    "by": "Billie Marten, 2023",
    "href": "https://open.spotify.com/track/66Ew9TmVnxjg8HTjsFoSts",
    "preview": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/18/2c/46/182c4633-b740-267b-793b-ccddf18ed893/mzaf_5440095513991210357.plus.aac.p.m4a"
  },
  {
    "kind": "film",
    "title": "Magnolia",
    "by": "Paul Thomas Anderson, 1999",
    "quote": "“I really do have love to give, I just don’t know where to put it.”"
  },
  {
    "kind": "photo",
    "src": "../sky/assets/pictures/picture-10.jpg",
    "alt": "Surfers in gray-green waves off a beach"
  },
  {
    "kind": "book",
    "title": "The Dispossessed",
    "by": "Ursula K. Le Guin, 1974"
  },
  {
    "kind": "video",
    "src": "../sky/assets/videos/video-02.mp4",
    "loop": true
  },
  {
    "kind": "photo",
    "src": "../sky/assets/pictures/picture-01.jpg",
    "alt": "Reading The Death of Ivan Ilyich on a balcony, trees beyond the railing"
  },
  {
    "kind": "video",
    "src": "../sky/assets/videos/video-03.mp4",
    "loop": true
  },
  {
    "kind": "film",
    "title": "Howl’s Moving Castle",
    "by": "Hayao Miyazaki, 2004",
    "quote": "“A heart’s a heavy burden.”"
  },
  {
    "kind": "photo",
    "src": "../sky/assets/pictures/picture-07.jpg",
    "alt": "A desk covered in handwritten notes in afternoon sun"
  },
  {
    "kind": "song",
    "title": "You Are the Right One",
    "by": "Sports, 2015",
    "href": "https://open.spotify.com/track/2qpacEyFxmbxCpIEqZkqvC",
    "preview": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/fe/d4/68/fed468c1-ebdc-c704-98f3-d4f9962c1a71/mzaf_15492757067457499237.plus.aac.p.m4a"
  },
  {
    "kind": "photo",
    "src": "../sky/assets/pictures/picture-04.jpg",
    "alt": "Cloud Gate in Chicago under hazy morning light"
  },
  {
    "kind": "film",
    "title": "La La Land",
    "by": "Damien Chazelle, 2016"
  },
  {
    "kind": "photo",
    "src": "../sky/assets/pictures/picture-09.jpg",
    "alt": "A tiger yawning on a rock in dense jungle"
  },
  {
    "kind": "photo",
    "src": "../sky/assets/pictures/picture-12.jpg",
    "alt": "An orange tent pitched beside a stone chimney under oaks"
  },
  {
    "kind": "photo",
    "src": "../sky/assets/pictures/picture-06.jpg",
    "alt": "A Ruth Asawa wire sculpture hanging in a gallery corner"
  },
  {
    "kind": "photo",
    "src": "../sky/assets/pictures/picture-02.jpg",
    "alt": "A framed photograph on a gallery wall: a smokestack and snowy mountain over a tidal shoreline"
  },
  {
    "kind": "book",
    "title": "Black Oaks",
    "by": "Mary Oliver, 1997",
    "quote": "“Today is a day like any other: twenty-four hours, a\nlittle sunshine, a little rain.\n\nListen, says ambition, nervously shifting her weight from\none boot to another — why don’t you get going?\n\nFor there I am, in the mossy shadows, under the trees.\n\nAnd to tell the truth I don’t want to let go of the wrists\nof idleness, I don’t want to sell my life for money,\n\nI don’t even want to come in out of the rain.”",
    "link": "https://www.poetseers.org/contemporary-poets/mary-oliver/mary-oliver-poems/black-oaks/"
  },
  {
    "kind": "song",
    "title": "Heart of Gold",
    "by": "Neil Young, 1972",
    "href": "https://open.spotify.com/track/1Q1b8eVkUPGlpSArl8JAVw",
    "preview": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f8/7a/8d/f87a8d65-e804-2530-be75-66a5c49539c1/mzaf_2822679759160215635.plus.aac.p.m4a"
  },
  {
    "kind": "photo",
    "src": "../sky/assets/pictures/picture-08.jpg",
    "alt": "The Milky Way overhead in a dark night sky"
  },
  {
    "kind": "film",
    "title": "In the Mood for Love",
    "by": "Wong Kar-wai, 2000",
    "quote": "“Those vanished years of the past,\nas if obstructed by an ashen glass window,\nable to peer, yet unable to grasp.”"
  },
  {
    "kind": "photo",
    "src": "../sky/assets/pictures/picture-14.jpg",
    "alt": "A pen sketch of the solar system, Earth labeled you are here"
  },
  {
    "kind": "film",
    "title": "Good Will Hunting",
    "by": "Gus Van Sant, 1997",
    "quote": "“Sean: Do you think you’re alone?\n\nWill: What?\n\nSean: Do you have a soul-mate?\n\nWill: Define that.\n\nSean: Someone who challenges you in every way. Who takes you places, opens things up for you. A soul-mate.\n\nWill: Yeah. Shakespeare, Nietzsche, Frost, O’Connor, Chaucer, Pope, Kant…\n\nSean: They’re all dead.\n\nWill: Not to me, they’re not.\n\nSean: But you can’t give back to them, Will.\n\nWill: Not without a heater and some serious smelling salts, no…\n\nSean: That’s what I’m saying, Will. You’ll never have that kind of relationship in a world where you’re afraid to take the first step because all you’re seeing are the negative things that might happen ten miles down the road.”"
  },
  {
    "kind": "photo",
    "src": "../sky/assets/pictures/picture-03.jpg",
    "alt": "Renoir's Chrysanthemums in a gold frame"
  },
  {
    "kind": "song",
    "title": "Heaven Knows",
    "by": "54 Ultra, 2024",
    "href": "https://open.spotify.com/track/5Hg1m5uhSPL75ejQgPOmyc",
    "preview": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ef/7f/38/ef7f3880-4d82-0b19-d693-473215ed538c/mzaf_16539153569886828687.plus.aac.p.m4a"
  },
  {
    "kind": "photo",
    "src": "../sky/assets/pictures/picture-13.jpg",
    "alt": "Arms out on a rock ledge in Yosemite valley"
  },
  {
    "kind": "video",
    "src": "../sky/assets/videos/video-01.mp4"
  },
  {
    "kind": "photo",
    "src": "../sky/assets/pictures/picture-05.jpg",
    "alt": "Standing in a doorway of a photography gallery"
  },
  {
    "kind": "film",
    "title": "Almost Famous",
    "by": "Cameron Crowe, 2000"
  },
  {
    "kind": "photo",
    "src": "../sky/assets/pictures/picture-11.jpg",
    "alt": "Koi blurring orange through dark water"
  },
  {
    "kind": "book",
    "title": "The Carrier Bag Theory of Fiction",
    "by": "Ursula K. Le Guin, 1986"
  },
  {
    "kind": "photo",
    "src": "../sky/assets/pictures/picture-15.jpg",
    "alt": "A tiny bee resting in an open palm beneath rainforest fronds"
  },
  {"kind": "pin", "src": "pins/pin-01.jpg", "w": 800, "h": 582, "alt": ""},
  {"kind": "pin", "src": "pins/pin-02.jpg", "w": 800, "h": 596, "alt": ""},
  {"kind": "pin", "src": "pins/pin-03.jpg", "w": 593, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-04.jpg", "w": 800, "h": 651, "alt": ""},
  {"kind": "pin", "src": "pins/pin-05.jpg", "w": 800, "h": 762, "alt": ""},
  {"kind": "pin", "src": "pins/pin-06.jpg", "w": 800, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-07.jpg", "w": 527, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-08.jpg", "w": 800, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-09.jpg", "w": 460, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-10.jpg", "w": 800, "h": 653, "alt": ""},
  {"kind": "pin", "src": "pins/pin-11.jpg", "w": 608, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-12.jpg", "w": 657, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-13.jpg", "w": 800, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-14.jpg", "w": 800, "h": 450, "alt": ""},
  {"kind": "pin", "src": "pins/pin-15.jpg", "w": 710, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-16.jpg", "w": 800, "h": 449, "alt": ""},
  {"kind": "pin", "src": "pins/pin-17.jpg", "w": 600, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-18.jpg", "w": 650, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-19.jpg", "w": 640, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-21.jpg", "w": 773, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-22.jpg", "w": 800, "h": 599, "alt": ""},
  {"kind": "pin", "src": "pins/pin-23.jpg", "w": 800, "h": 692, "alt": ""},
  {"kind": "pin", "src": "pins/pin-24.jpg", "w": 800, "h": 536, "alt": ""},
  {"kind": "pin", "src": "pins/pin-25.jpg", "w": 800, "h": 732, "alt": ""},
  {"kind": "pin", "src": "pins/pin-26.jpg", "w": 640, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-27.jpg", "w": 800, "h": 569, "alt": ""},
  {"kind": "pin", "src": "pins/pin-28.jpg", "w": 800, "h": 781, "alt": ""},
  {"kind": "pin", "src": "pins/pin-29.jpg", "w": 800, "h": 775, "alt": ""},
  {"kind": "pin", "src": "pins/pin-30.jpg", "w": 602, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-31.jpg", "w": 800, "h": 792, "alt": ""},
  {"kind": "pin", "src": "pins/pin-32.jpg", "w": 800, "h": 600, "alt": ""},
  {"kind": "pin", "src": "pins/pin-33.jpg", "w": 800, "h": 638, "alt": ""},
  {"kind": "pin", "src": "pins/pin-34.jpg", "w": 800, "h": 450, "alt": ""},
  {"kind": "pin", "src": "pins/pin-35.jpg", "w": 800, "h": 798, "alt": ""},
  {"kind": "pin", "src": "pins/pin-36.jpg", "w": 800, "h": 766, "alt": ""},
  {"kind": "pin", "src": "pins/pin-37.jpg", "w": 800, "h": 793, "alt": ""},
  {"kind": "pin", "src": "pins/pin-38.jpg", "w": 800, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-39.jpg", "w": 597, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-40.jpg", "w": 800, "h": 507, "alt": ""},
  {"kind": "pin", "src": "pins/pin-41.jpg", "w": 800, "h": 784, "alt": ""},
  {"kind": "pin", "src": "pins/pin-42.jpg", "w": 800, "h": 788, "alt": ""},
  {"kind": "pin", "src": "pins/pin-43.jpg", "w": 800, "h": 790, "alt": ""},
  {"kind": "pin", "src": "pins/pin-44.jpg", "w": 800, "h": 791, "alt": ""},
  {"kind": "pin", "src": "pins/pin-45.jpg", "w": 800, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-46.jpg", "w": 800, "h": 608, "alt": ""},
  {"kind": "pin", "src": "pins/pin-47.jpg", "w": 800, "h": 450, "alt": ""},
  {"kind": "pin", "src": "pins/pin-48.jpg", "w": 800, "h": 530, "alt": ""},
  {"kind": "pin", "src": "pins/pin-49.jpg", "w": 800, "h": 697, "alt": ""},
  {"kind": "pin", "src": "pins/pin-50.jpg", "w": 800, "h": 595, "alt": ""},
  {"kind": "pin", "src": "pins/pin-51.jpg", "w": 767, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-52.jpg", "w": 707, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-53.jpg", "w": 600, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-54.jpg", "w": 547, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-55.jpg", "w": 800, "h": 572, "alt": ""},
  {"kind": "pin", "src": "pins/pin-56.jpg", "w": 707, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-57.jpg", "w": 800, "h": 560, "alt": ""},
  {"kind": "pin", "src": "pins/pin-58.jpg", "w": 735, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-59.jpg", "w": 800, "h": 532, "alt": ""},
  {"kind": "pin", "src": "pins/pin-60.jpg", "w": 800, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-61.jpg", "w": 800, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-62.jpg", "w": 800, "h": 785, "alt": ""},
  {"kind": "pin", "src": "pins/pin-63.jpg", "w": 600, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-64.jpg", "w": 800, "h": 392, "alt": ""},
  {"kind": "pin", "src": "pins/pin-65.jpg", "w": 800, "h": 682, "alt": ""},
  {"kind": "pin", "src": "pins/pin-66.jpg", "w": 540, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-67.jpg", "w": 800, "h": 607, "alt": ""},
  {"kind": "pin", "src": "pins/pin-68.jpg", "w": 800, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-69.jpg", "w": 450, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-70.jpg", "w": 688, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-71.jpg", "w": 800, "h": 451, "alt": ""},
  {"kind": "pin", "src": "pins/pin-72.jpg", "w": 800, "h": 450, "alt": ""},
  {"kind": "pin", "src": "pins/pin-73.jpg", "w": 656, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-74.jpg", "w": 800, "h": 749, "alt": ""},
  {"kind": "pin", "src": "pins/pin-75.jpg", "w": 652, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-76.jpg", "w": 570, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-77.jpg", "w": 642, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-78.jpg", "w": 800, "h": 600, "alt": ""},
  {"kind": "pin", "src": "pins/pin-79.jpg", "w": 571, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-80.jpg", "w": 800, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-81.jpg", "w": 640, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-82.jpg", "w": 640, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-83.jpg", "w": 800, "h": 612, "alt": ""},
  {"kind": "pin", "src": "pins/pin-84.jpg", "w": 600, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-85.jpg", "w": 800, "h": 691, "alt": ""},
  {"kind": "pin", "src": "pins/pin-86.jpg", "w": 600, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-87.gif", "w": 800, "h": 509, "alt": ""},
  {"kind": "pin", "src": "pins/pin-88.jpg", "w": 571, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-89.jpg", "w": 599, "h": 800, "alt": ""},
  {"kind": "pin", "src": "pins/pin-90.jpg", "w": 619, "h": 800, "alt": ""}
];
