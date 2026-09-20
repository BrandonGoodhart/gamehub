/* Game Forge — question bank.
 * Shape: [question, correctAnswer, distractor, distractor, distractor]
 * Bands: early (K-2), elementary (3-5), middle (6-8), high (9-12).
 * A subject that omits a band falls back to the nearest one it has.
 */
window.FORGE = window.FORGE || {};

window.FORGE.BANK = {
  math: {
    name: 'Math', emoji: '➗', tint: '#4f8cff',
    sets: {
      early: [
        ['What is 2 + 3?', '5', '4', '6', '7'],
        ['What is 10 − 4?', '6', '5', '7', '14'],
        ['How many sides does a triangle have?', '3', '4', '5', '2'],
        ['What number comes right after 19?', '20', '21', '18', '90'],
        ['How many minutes are in one hour?', '60', '30', '100', '12'],
        ['What is 5 + 5?', '10', '9', '11', '15'],
        ['Which number is biggest: 7, 3, or 9?', '9', '7', '3', 'They are equal'],
        ['How many corners does a square have?', '4', '3', '5', '6'],
        ['What is half of 8?', '4', '2', '6', '16'],
        ['Count by 2s: 2, 4, 6, __', '8', '7', '9', '10'],
        ['How many days are in a week?', '7', '5', '10', '12'],
        ['What is 3 × 2?', '6', '5', '8', '9']
      ],
      elementary: [
        ['What is 7 × 8?', '56', '54', '63', '48'],
        ['What is 144 ÷ 12?', '12', '11', '14', '24'],
        ['What is the perimeter of a square with 5 cm sides?', '20 cm', '10 cm', '25 cm', '15 cm'],
        ['Which fraction equals 1/2?', '4/8', '1/3', '2/5', '3/8'],
        ['What is 0.25 written as a fraction?', '1/4', '1/2', '2/5', '1/25'],
        ['How many degrees are in a right angle?', '90', '45', '180', '360'],
        ['What is 1,000 − 250?', '750', '650', '850', '700'],
        ['What is the area of a rectangle 6 by 4?', '24', '10', '20', '12'],
        ['Round 487 to the nearest hundred.', '500', '400', '480', '490'],
        ['What is 9 × 9?', '81', '72', '99', '89'],
        ['Which of these is a prime number?', '17', '9', '15', '21'],
        ['What is 3/4 + 1/4?', '1', '4/8', '3/8', '2']
      ],
      middle: [
        ['Solve for x: 3x + 6 = 21', '5', '7', '9', '3'],
        ['What is 15% of 200?', '30', '15', '45', '20'],
        ['What is the square root of 169?', '13', '12', '14', '17'],
        ['In y = mx + b, what does m stand for?', 'The slope', 'The y-intercept', 'The x value', 'The area'],
        ['What do the interior angles of a triangle add up to?', '180°', '90°', '360°', '270°'],
        ['What is −7 + 12?', '5', '−5', '19', '−19'],
        ['What is 2 to the 5th power?', '32', '16', '25', '64'],
        ['π is approximately equal to what?', '3.14', '2.72', '1.61', '3.41'],
        ['What is the median of 3, 7, 9, 15, 21?', '9', '7', '11', '15'],
        ['What is the formula for the area of a circle?', 'πr²', '2πr', 'πd', 'r²/π'],
        ['What is 5! (five factorial)?', '120', '25', '60', '720'],
        ['Convert 3/8 to a decimal.', '0.375', '0.38', '0.83', '0.125']
      ],
      high: [
        ['What is the derivative of x³?', '3x²', 'x²', '3x', 'x⁴/4'],
        ['What does sin(90°) equal?', '1', '0', '−1', '0.5'],
        ['What does log₁₀(1000) equal?', '3', '10', '100', '2'],
        ['Solve: |x| = 5', 'x = 5 or x = −5', 'x = 5 only', 'x = −5 only', 'No solution'],
        ['State the Pythagorean theorem.', 'a² + b² = c²', 'a + b = c', 'a² − b² = c²', '2a + 2b = c'],
        ['What is the slope of the line through (1,2) and (3,8)?', '3', '2', '6', '4'],
        ['What is the discriminant of ax² + bx + c?', 'b² − 4ac', '4ac − b²', '2a', '−b/2a'],
        ['What does cos(0) equal?', '1', '0', '−1', '0.5'],
        ['What is the sum of the integers from 1 to 100?', '5050', '1000', '10,000', '5000'],
        ['A function that is its own inverse when reflected over y = x is called what?', 'An inverse function', 'A quadratic', 'A limit', 'An asymptote'],
        ['What is the integral of 2x dx?', 'x² + C', '2 + C', 'x³ + C', '2x² + C'],
        ['In a right triangle, tangent equals which ratio?', 'Opposite over adjacent', 'Adjacent over hypotenuse', 'Opposite over hypotenuse', 'Hypotenuse over adjacent']
      ]
    }
  },

  science: {
    name: 'Science', emoji: '\u{1f9ea}', tint: '#2fd6a8',
    sets: {
      early: [
        ['What do plants need to grow?', 'Sunlight and water', 'Only rocks', 'Only wind', 'Nothing at all'],
        ['How many legs does an insect have?', '6', '4', '8', '10'],
        ['What is frozen water called?', 'Ice', 'Steam', 'Sand', 'A cloud'],
        ['Which of these animals lays eggs?', 'A chicken', 'A dog', 'A cat', 'A cow'],
        ['What do we call the air all around Earth?', 'The atmosphere', 'The ocean', 'The desert', 'The forest'],
        ['Which season comes right after winter?', 'Spring', 'Fall', 'Summer', 'Monday'],
        ['Which one of these is a mammal?', 'A dolphin', 'A shark', 'A frog', 'A snake'],
        ['Which part of a plant drinks water from the soil?', 'The roots', 'The leaves', 'The flower', 'The seeds'],
        ['What color do you get when you mix red and yellow?', 'Orange', 'Green', 'Purple', 'Blue'],
        ['Is the Sun a star or a planet?', 'A star', 'A planet', 'A moon', 'A comet'],
        ['What do we call water falling from clouds?', 'Rain', 'Sand', 'Smoke', 'Grass'],
        ['Which sense do you use with your nose?', 'Smell', 'Taste', 'Hearing', 'Touch']
      ],
      elementary: [
        ['What are the three main states of matter?', 'Solid, liquid, gas', 'Hot, warm, cold', 'Big, medium, small', 'Rock, water, air'],
        ['What force pulls objects toward Earth?', 'Gravity', 'Magnetism', 'Friction', 'Electricity'],
        ['Which gas do people need to breathe in?', 'Oxygen', 'Nitrogen', 'Helium', 'Carbon dioxide'],
        ['What is the process plants use to make their own food?', 'Photosynthesis', 'Digestion', 'Evaporation', 'Respiration'],
        ['How many bones are in the adult human body?', '206', '106', '300', '150'],
        ['Which organ pumps blood around your body?', 'The heart', 'The lungs', 'The liver', 'The brain'],
        ['What is the largest organ of the human body?', 'The skin', 'The heart', 'The stomach', 'The brain'],
        ['At what temperature does water boil in Celsius?', '100°C', '50°C', '0°C', '200°C'],
        ['What do we call animals that eat only plants?', 'Herbivores', 'Carnivores', 'Omnivores', 'Predators'],
        ['What is the hardest natural substance on Earth?', 'Diamond', 'Iron', 'Granite', 'Gold'],
        ['What tool measures temperature?', 'A thermometer', 'A barometer', 'A ruler', 'A scale'],
        ['What are the three parts of the water cycle shown by clouds and rain?', 'Evaporation, condensation, precipitation', 'Melting, freezing, boiling', 'Sunrise, noon, sunset', 'Wind, dust, fog']
      ],
      middle: [
        ['What is the chemical symbol for gold?', 'Au', 'Ag', 'Go', 'Gd'],
        ['What everyday substance has the formula H₂O?', 'Water', 'Salt', 'Sugar', 'Oxygen gas'],
        ['Which organelle is called the powerhouse of the cell?', 'The mitochondria', 'The nucleus', 'The ribosome', 'The vacuole'],
        ['What does Newton’s third law say?', 'Every action has an equal and opposite reaction', 'Objects always slow down', 'Force equals mass times speed', 'Energy is always lost'],
        ['Which subatomic particle carries a negative charge?', 'The electron', 'The proton', 'The neutron', 'The nucleus'],
        ['What is the pH of a neutral solution?', '7', '0', '14', '1'],
        ['Which planet is closest to the Sun?', 'Mercury', 'Venus', 'Earth', 'Mars'],
        ['What does DNA stand for?', 'Deoxyribonucleic acid', 'Dual nuclear acid', 'Dense nucleic atom', 'Divided nucleus array'],
        ['About how fast does light travel?', '300,000 km per second', '300 km per second', '3,000 km per hour', '30 km per second'],
        ['Which blood cells fight infection?', 'White blood cells', 'Red blood cells', 'Platelets', 'Plasma cells'],
        ['A change that forms a brand new substance is called what?', 'A chemical change', 'A physical change', 'A phase change', 'A state change'],
        ['The periodic table arranges elements by what?', 'Atomic number', 'Weight in grams', 'Alphabetical order', 'Date discovered']
      ],
      high: [
        ['What is Avogadro’s number, approximately?', '6.022 × 10²³', '3.14 × 10⁸', '9.81 × 10¹⁰', '1.6 × 10⁻¹⁹'],
        ['What does the first law of thermodynamics state?', 'Energy cannot be created or destroyed', 'Entropy always decreases', 'Heat flows from cold to hot', 'Mass is always conserved in reactions'],
        ['Which organelle carries out photosynthesis?', 'The chloroplast', 'The mitochondria', 'The nucleus', 'The lysosome'],
        ['What is the chemical formula for table salt?', 'NaCl', 'KCl', 'NaOH', 'CaCO₃'],
        ['Which type of bond involves sharing electrons?', 'A covalent bond', 'An ionic bond', 'A metallic bond', 'A hydrogen bond'],
        ['Gregor Mendel is known as the father of which field?', 'Genetics', 'Chemistry', 'Astronomy', 'Geology'],
        ['What is the unit of electrical resistance?', 'The ohm', 'The volt', 'The amp', 'The watt'],
        ['What does an enzyme do in a cell?', 'Speeds up chemical reactions', 'Stores genetic code', 'Carries oxygen', 'Builds the cell wall'],
        ['Who proposed the equation E = mc²?', 'Albert Einstein', 'Isaac Newton', 'Niels Bohr', 'Marie Curie'],
        ['How many daughter cells does mitosis produce?', '2', '4', '1', '8'],
        ['What is an isotope?', 'An atom with a different number of neutrons', 'An atom with extra electrons', 'A charged molecule', 'A type of chemical bond'],
        ['Which law relates pressure and volume of a gas at constant temperature?', 'Boyle’s law', 'Charles’s law', 'Ohm’s law', 'Hooke’s law']
      ]
    }
  },

  geography: {
    name: 'Geography', emoji: '\u{1f30d}', tint: '#f2a03d',
    sets: {
      early: [
        ['Which is the largest ocean on Earth?', 'The Pacific Ocean', 'The Atlantic Ocean', 'The Indian Ocean', 'The Arctic Ocean'],
        ['What do we call a very dry, sandy place?', 'A desert', 'A jungle', 'An island', 'A glacier'],
        ['What is the capital of the United States?', 'Washington, D.C.', 'New York City', 'Los Angeles', 'Chicago'],
        ['Which is bigger, a city or a country?', 'A country', 'A city', 'They are the same', 'It depends on the day'],
        ['What shape is the Earth?', 'Round, like a ball', 'Flat, like a plate', 'Square', 'Triangle'],
        ['What do we call a very tall landform?', 'A mountain', 'A valley', 'A lake', 'A field'],
        ['What do you use to find places on Earth?', 'A map', 'A spoon', 'A shoe', 'A clock'],
        ['Which place on Earth is covered in ice at the very bottom of the globe?', 'Antarctica', 'Africa', 'Australia', 'Brazil'],
        ['What is a large body of salty water called?', 'An ocean', 'A pond', 'A puddle', 'A creek'],
        ['Which direction is at the top of most maps?', 'North', 'South', 'East', 'West']
      ],
      elementary: [
        ['How many continents are there on Earth?', '7', '5', '6', '8'],
        ['Which famous river flows through Egypt?', 'The Nile', 'The Amazon', 'The Danube', 'The Ganges'],
        ['Which country is the largest by land area?', 'Russia', 'Canada', 'China', 'The United States'],
        ['What is the capital of France?', 'Paris', 'Lyon', 'Nice', 'Marseille'],
        ['Which ocean lies between North America and Europe?', 'The Atlantic Ocean', 'The Pacific Ocean', 'The Indian Ocean', 'The Southern Ocean'],
        ['What is the tallest mountain above sea level?', 'Mount Everest', 'K2', 'Mount Fuji', 'Denali'],
        ['Egypt is on which continent?', 'Africa', 'Asia', 'Europe', 'South America'],
        ['What is the capital of Japan?', 'Tokyo', 'Kyoto', 'Osaka', 'Seoul'],
        ['Which imaginary line divides Earth into north and south halves?', 'The Equator', 'The Prime Meridian', 'The Tropic of Cancer', 'The Axis'],
        ['Which US state is largest by area?', 'Alaska', 'Texas', 'California', 'Montana'],
        ['Which country is shaped like a boot?', 'Italy', 'Spain', 'Greece', 'Portugal'],
        ['What is the largest hot desert in the world?', 'The Sahara', 'The Gobi', 'The Mojave', 'The Kalahari']
      ],
      middle: [
        ['What is the capital of Australia?', 'Canberra', 'Sydney', 'Melbourne', 'Perth'],
        ['Which two countries have populations over one billion?', 'India and China', 'China and Russia', 'India and Brazil', 'The US and China'],
        ['What is the smallest country in the world?', 'Vatican City', 'Monaco', 'San Marino', 'Liechtenstein'],
        ['Which strait splits Istanbul between Europe and Asia?', 'The Bosphorus', 'The Strait of Gibraltar', 'The Suez Canal', 'The Bering Strait'],
        ['What is the capital of Canada?', 'Ottawa', 'Toronto', 'Vancouver', 'Montreal'],
        ['Which river carved the Grand Canyon?', 'The Colorado River', 'The Rio Grande', 'The Mississippi River', 'The Snake River'],
        ['Which lines measure distance east and west of the Prime Meridian?', 'Lines of longitude', 'Lines of latitude', 'Contour lines', 'Tropic lines'],
        ['Which continent has no permanent human residents?', 'Antarctica', 'Australia', 'Africa', 'South America'],
        ['What is the capital of Brazil?', 'Brasília', 'Rio de Janeiro', 'São Paulo', 'Salvador'],
        ['Mount Kilimanjaro is in which country?', 'Tanzania', 'Kenya', 'Uganda', 'Ethiopia'],
        ['What is a peninsula?', 'Land surrounded by water on three sides', 'Land fully surrounded by water', 'A ring of coral', 'A narrow sea channel'],
        ['Which mountain range runs along the west coast of South America?', 'The Andes', 'The Rockies', 'The Alps', 'The Urals']
      ],
      high: [
        ['Which body of water is famous for being so salty that people float easily?', 'The Dead Sea', 'The Red Sea', 'The Caspian Sea', 'The Black Sea'],
        ['What is the deepest known ocean trench?', 'The Mariana Trench', 'The Puerto Rico Trench', 'The Java Trench', 'The Tonga Trench'],
        ['Which line of latitude sits at 23.5° north?', 'The Tropic of Cancer', 'The Tropic of Capricorn', 'The Arctic Circle', 'The Equator'],
        ['What is the largest island in the world?', 'Greenland', 'Australia', 'Madagascar', 'Borneo'],
        ['Which mountain range separates France and Spain?', 'The Pyrenees', 'The Alps', 'The Apennines', 'The Carpathians'],
        ['What is the capital of Turkey?', 'Ankara', 'Istanbul', 'Izmir', 'Bursa'],
        ['The Atacama Desert lies mostly in which country?', 'Chile', 'Peru', 'Argentina', 'Bolivia'],
        ['Which is the largest freshwater lake by surface area?', 'Lake Superior', 'Lake Victoria', 'Lake Baikal', 'Lake Michigan'],
        ['What is a fjord?', 'A deep glacier-carved inlet of the sea', 'A desert oasis', 'A volcanic crater lake', 'A river delta'],
        ['Which African country was never formally colonized by a European power?', 'Ethiopia', 'Ghana', 'Kenya', 'Senegal'],
        ['What causes most earthquakes?', 'Movement of tectonic plates', 'Heavy rainfall', 'Ocean tides', 'Solar flares'],
        ['What is the Ring of Fire?', 'A zone of volcanoes and quakes around the Pacific', 'A desert belt across Africa', 'A coral reef chain', 'An Arctic ice sheet']
      ]
    }
  },

  history: {
    name: 'History', emoji: '\u{1f3db}️', tint: '#c98fff',
    sets: {
      elementary: [
        ['Who was the first president of the United States?', 'George Washington', 'Abraham Lincoln', 'Thomas Jefferson', 'John Adams'],
        ['What ship carried the Pilgrims to America?', 'The Mayflower', 'The Titanic', 'The Santa Maria', 'The Endeavour'],
        ['Who was the main author of the Declaration of Independence?', 'Thomas Jefferson', 'Benjamin Franklin', 'John Hancock', 'James Madison'],
        ['In what year did Columbus first sail to the Americas?', '1492', '1620', '1776', '1300'],
        ['Dr. Martin Luther King Jr. was a leader of what movement?', 'The civil rights movement', 'The space race', 'The gold rush', 'The Renaissance'],
        ['Which ancient people built the great pyramids at Giza?', 'The Egyptians', 'The Romans', 'The Vikings', 'The Aztecs'],
        ['Who is commonly credited with inventing the practical light bulb?', 'Thomas Edison', 'Albert Einstein', 'Henry Ford', 'Alexander Bell'],
        ['What kind of home did knights and lords live in?', 'A castle', 'A skyscraper', 'A tent', 'A submarine'],
        ['Who was the first woman to fly solo across the Atlantic Ocean?', 'Amelia Earhart', 'Sally Ride', 'Harriet Tubman', 'Clara Barton'],
        ['The United States declared independence from which country?', 'Great Britain', 'France', 'Spain', 'Canada'],
        ['Who led enslaved people to freedom on the Underground Railroad?', 'Harriet Tubman', 'Betsy Ross', 'Pocahontas', 'Sacagawea'],
        ['What did people travel west in during the 1800s?', 'Covered wagons', 'Airplanes', 'Subways', 'Race cars']
      ],
      middle: [
        ['In what year did World War II end?', '1945', '1939', '1918', '1950'],
        ['Who was president of the US during the Civil War?', 'Abraham Lincoln', 'Andrew Jackson', 'Ulysses S. Grant', 'Woodrow Wilson'],
        ['Which wall divided a German city until 1989?', 'The Berlin Wall', 'Hadrian’s Wall', 'The Great Wall', 'The Western Wall'],
        ['Who led India’s nonviolent independence movement?', 'Mahatma Gandhi', 'Nelson Mandela', 'Ho Chi Minh', 'Sun Yat-sen'],
        ['What was the Silk Road?', 'A network of trade routes linking Asia and Europe', 'A Roman highway', 'A river in China', 'A type of ship'],
        ['Who was the first person to walk on the Moon?', 'Neil Armstrong', 'Buzz Aldrin', 'Yuri Gagarin', 'John Glenn'],
        ['Which empire was ruled from the city of Rome?', 'The Roman Empire', 'The Ottoman Empire', 'The Mongol Empire', 'The Inca Empire'],
        ['Which founding document begins with the words “We the People”?', 'The US Constitution', 'The Declaration of Independence', 'The Bill of Rights', 'The Gettysburg Address'],
        ['In which city did Rosa Parks refuse to give up her bus seat?', 'Montgomery, Alabama', 'Atlanta, Georgia', 'Memphis, Tennessee', 'Selma, Alabama'],
        ['In what year did the United States declare independence?', '1776', '1789', '1812', '1620'],
        ['What was the Renaissance?', 'A rebirth of art and learning in Europe', 'A medieval plague', 'A Roman civil war', 'A Viking migration'],
        ['Which civilization built Machu Picchu?', 'The Inca', 'The Maya', 'The Aztec', 'The Olmec']
      ],
      high: [
        ['Which treaty formally ended World War I?', 'The Treaty of Versailles', 'The Treaty of Paris', 'The Treaty of Ghent', 'The Treaty of Tordesillas'],
        ['What was the Magna Carta?', 'A 1215 charter limiting the English king’s power', 'A Roman law code', 'A Greek constitution', 'A trade agreement'],
        ['Who was the first emperor to unify China?', 'Qin Shi Huang', 'Kublai Khan', 'Emperor Wu', 'Sun Tzu'],
        ['Which event is usually named as the spark of World War I?', 'The assassination of Archduke Franz Ferdinand', 'The invasion of Poland', 'The sinking of the Lusitania', 'The Boston Tea Party'],
        ['The Renaissance began in which country?', 'Italy', 'France', 'England', 'Germany'],
        ['What was the Cold War?', 'Decades of tension between the US and the Soviet Union', 'A war fought in the Arctic', 'A trade dispute in Europe', 'A civil war in China'],
        ['Who co-wrote “The Communist Manifesto”?', 'Karl Marx and Friedrich Engels', 'Vladimir Lenin', 'Adam Smith', 'Jean-Jacques Rousseau'],
        ['In what year did the Soviet Union dissolve?', '1991', '1989', '1985', '1979'],
        ['What was the Industrial Revolution?', 'A shift to machine-based manufacturing', 'A farming reform in Russia', 'A religious movement', 'A wave of European revolutions'],
        ['Which political prisoner later became president of South Africa?', 'Nelson Mandela', 'Desmond Tutu', 'Steve Biko', 'Thabo Mbeki'],
        ['What was the Columbian Exchange?', 'The transfer of crops, animals and disease between hemispheres', 'A stock market in Bogotá', 'A Spanish tax system', 'A treaty over Caribbean islands'],
        ['The Enlightenment emphasized which idea above all?', 'Reason and individual rights', 'Divine right of kings', 'Feudal loyalty', 'Military conquest']
      ]
    }
  },

  words: {
    name: 'Words & Spelling', emoji: '\u{1f524}', tint: '#ff7fb0',
    sets: {
      early: [
        ['Which word rhymes with “cat”?', 'Hat', 'Dog', 'Sun', 'Cup'],
        ['What is the opposite of “big”?', 'Small', 'Tall', 'Loud', 'Fast'],
        ['How many letters are in the English alphabet?', '26', '24', '30', '20'],
        ['Which of these words is a color?', 'Blue', 'Jump', 'Chair', 'Loud'],
        ['What letter does the word “apple” start with?', 'A', 'E', 'P', 'L'],
        ['Which one is a complete sentence?', 'The dog ran.', 'The dog', 'Ran fast', 'Big red'],
        ['What is the plural of “box”?', 'Boxes', 'Boxs', 'Boxen', 'Box'],
        ['What do you call more than one mouse?', 'Mice', 'Mouses', 'Mouse', 'Mices'],
        ['Which punctuation mark ends a question?', 'A question mark', 'A period', 'A comma', 'An exclamation point'],
        ['Which word names a place?', 'School', 'Jump', 'Quickly', 'Shiny'],
        ['Which word is spelled correctly?', 'Friend', 'Freind', 'Frend', 'Friendd'],
        ['What sound do the letters “sh” make?', 'The “shh” sound', 'The “kuh” sound', 'The “zzz” sound', 'The “thh” sound']
      ],
      elementary: [
        ['Which word is a synonym for “happy”?', 'Joyful', 'Angry', 'Sleepy', 'Hungry'],
        ['Which word is an antonym for “ancient”?', 'Modern', 'Old', 'Dusty', 'Historic'],
        ['Which word is spelled correctly?', 'Beautiful', 'Beutiful', 'Beautifull', 'Butiful'],
        ['What is a noun?', 'A person, place, or thing', 'An action word', 'A describing word', 'A joining word'],
        ['What do we call a word that describes a noun?', 'An adjective', 'A verb', 'An adverb', 'A pronoun'],
        ['What is the past tense of “run”?', 'Ran', 'Runned', 'Running', 'Runs'],
        ['What is the plural of “child”?', 'Children', 'Childs', 'Childes', 'Childrens'],
        ['Which word is a verb?', 'Sprint', 'Bright', 'Table', 'Slowly'],
        ['Which punctuation mark shows possession?', 'An apostrophe', 'A comma', 'A colon', 'A hyphen'],
        ['“Their”, “there” and “they’re” are examples of what?', 'Homophones', 'Synonyms', 'Antonyms', 'Prefixes'],
        ['What is a compound word?', 'Two words joined into one', 'A word with a silent letter', 'A word with three syllables', 'A misspelled word'],
        ['Which word is spelled correctly?', 'Separate', 'Seperate', 'Seperete', 'Separete']
      ],
      middle: [
        ['What does the prefix “pre-” mean?', 'Before', 'After', 'Against', 'Again'],
        ['What is a metaphor?', 'A comparison made without “like” or “as”', 'A comparison using “like” or “as”', 'An exaggeration', 'A sound word'],
        ['What does “benevolent” mean?', 'Kind and generous', 'Angry', 'Confused', 'Quiet'],
        ['What is alliteration?', 'Repeating the same beginning sound', 'Rhyming line endings', 'Exaggerating for effect', 'Comparing two things'],
        ['What does the root “aqua” mean?', 'Water', 'Fire', 'Earth', 'Air'],
        ['What is a simile?', 'A comparison using “like” or “as”', 'A direct comparison without “like”', 'An exaggeration', 'A repeated sound'],
        ['Which word is spelled correctly?', 'Necessary', 'Neccessary', 'Necesary', 'Neccesary'],
        ['What does “reluctant” mean?', 'Unwilling', 'Eager', 'Confident', 'Exhausted'],
        ['What is onomatopoeia?', 'A word that imitates a sound', 'A word with two meanings', 'A word borrowed from Latin', 'A compound word'],
        ['What does the suffix “-ology” mean?', 'The study of', 'The fear of', 'The opposite of', 'One who does'],
        ['What does “diligent” mean?', 'Hardworking and careful', 'Lazy', 'Cheerful', 'Nervous'],
        ['What is a clause?', 'A group of words with a subject and a verb', 'Any group of three words', 'A punctuation rule', 'A kind of adjective']
      ],
      high: [
        ['What does “ubiquitous” mean?', 'Present everywhere', 'Extremely rare', 'Very old', 'Hard to read'],
        ['What is an oxymoron?', 'Two contradictory words placed together', 'A long sentence', 'A repeated phrase', 'A rhetorical question'],
        ['What does “ephemeral” mean?', 'Lasting a very short time', 'Extremely heavy', 'Deeply meaningful', 'Widely known'],
        ['What is juxtaposition?', 'Placing two things side by side for contrast', 'Repeating a word for emphasis', 'Ending on a cliffhanger', 'Using a narrator'],
        ['What does “pragmatic” mean?', 'Practical and realistic', 'Idealistic', 'Emotional', 'Secretive'],
        ['What is a paradox?', 'A statement that seems contradictory but may be true', 'A logical proof', 'A factual error', 'A type of rhyme'],
        ['What does “candid” mean?', 'Honest and direct', 'Nervous', 'Wealthy', 'Confusing'],
        ['What is hyperbole?', 'Deliberate exaggeration for effect', 'Understatement', 'A sound word', 'A comparison using “like”'],
        ['What does “esoteric” mean?', 'Understood by only a few', 'Widely popular', 'Ancient', 'Illegal'],
        ['What is the tone of a piece of writing?', 'The author’s attitude toward the subject', 'The number of characters', 'The setting', 'The plot structure'],
        ['What does “innocuous” mean?', 'Harmless', 'Poisonous', 'Loud', 'Expensive'],
        ['What is a rhetorical question?', 'A question asked for effect, not for an answer', 'A question on a test', 'A question with two answers', 'A question in a debate']
      ]
    }
  },

  reading: {
    name: 'Reading & Literature', emoji: '\u{1f4da}', tint: '#5ad1ff',
    sets: {
      elementary: [
        ['Who wrote “Charlotte’s Web”?', 'E. B. White', 'Roald Dahl', 'Beverly Cleary', 'Judy Blume'],
        ['What do we call the main character of a story?', 'The protagonist', 'The narrator', 'The author', 'The editor'],
        ['What is the setting of a story?', 'Where and when it takes place', 'The main problem', 'The lesson', 'The list of characters'],
        ['Who wrote “The Cat in the Hat”?', 'Dr. Seuss', 'Shel Silverstein', 'Eric Carle', 'Maurice Sendak'],
        ['What is a fable?', 'A short story that teaches a lesson', 'A true life story', 'A long poem', 'A news article'],
        ['What do we call the main problem in a story?', 'The conflict', 'The setting', 'The theme', 'The preface'],
        ['In “Cinderella”, what does she leave behind at the ball?', 'A glass slipper', 'A golden crown', 'A red cloak', 'A silver ring'],
        ['What is fiction?', 'A made-up story', 'A true report', 'A dictionary entry', 'A set of instructions'],
        ['What are the words characters speak called?', 'Dialogue', 'Narration', 'Summary', 'Caption'],
        ['What is the part of a story that introduces the characters?', 'The exposition', 'The climax', 'The resolution', 'The epilogue'],
        ['What is nonfiction?', 'Writing about real facts and events', 'A fairy tale', 'A poem', 'A play'],
        ['What is the sequence of events in a story called?', 'The plot', 'The mood', 'The genre', 'The index']
      ],
      middle: [
        ['Who wrote “Romeo and Juliet”?', 'William Shakespeare', 'Charles Dickens', 'Geoffrey Chaucer', 'John Steinbeck'],
        ['What is the climax of a story?', 'The turning point of highest tension', 'The opening scene', 'The list of characters', 'The final sentence'],
        ['Who wrote “The Outsiders”?', 'S. E. Hinton', 'Gary Paulsen', 'Katherine Paterson', 'Mildred Taylor'],
        ['What is foreshadowing?', 'Hints about what will happen later', 'A flashback to the past', 'A summary of the plot', 'A change of narrator'],
        ['What is the theme of a story?', 'Its central message or idea', 'Its setting', 'Its word count', 'Its cover design'],
        ['Who wrote the “Harry Potter” series?', 'J. K. Rowling', 'C. S. Lewis', 'Philip Pullman', 'Rick Riordan'],
        ['What is first-person point of view?', 'A narrator who uses “I”', 'A narrator who knows everything', 'A narrator who uses “you”', 'A story told in letters'],
        ['What do we call the character who opposes the protagonist?', 'The antagonist', 'The narrator', 'The foil', 'The sidekick'],
        ['What is personification?', 'Giving human traits to non-human things', 'Comparing with “like” or “as”', 'Repeating a beginning sound', 'Exaggerating for effect'],
        ['Who wrote “The Giver”?', 'Lois Lowry', 'Madeleine L’Engle', 'Jerry Spinelli', 'Louis Sachar'],
        ['What is an inference?', 'A conclusion drawn from clues in the text', 'A direct quotation', 'A chapter summary', 'The author’s biography'],
        ['What is a flashback?', 'A scene that jumps back in time', 'A hint about the future', 'A change of setting', 'A spoken aside']
      ],
      high: [
        ['Who wrote “1984”?', 'George Orwell', 'Aldous Huxley', 'Ray Bradbury', 'Kurt Vonnegut'],
        ['Who wrote “To Kill a Mockingbird”?', 'Harper Lee', 'Flannery O’Connor', 'John Steinbeck', 'Willa Cather'],
        ['What is an allegory?', 'A story with a hidden symbolic meaning', 'A biography', 'A rhyming poem', 'A stage direction'],
        ['Who wrote “The Great Gatsby”?', 'F. Scott Fitzgerald', 'Ernest Hemingway', 'William Faulkner', 'Edith Wharton'],
        ['What is iambic pentameter?', 'A line of ten syllables in five stressed beats', 'A poem of fourteen lines', 'A rhyme at the start of lines', 'A prose rhythm'],
        ['Who wrote “Things Fall Apart”?', 'Chinua Achebe', 'Wole Soyinka', 'Ngũgĩ wa Thiong’o', 'Ben Okri'],
        ['What is dramatic irony?', 'When the audience knows more than the characters', 'When a character lies', 'When the plot reverses', 'When a narrator is unreliable'],
        ['Who wrote “Pride and Prejudice”?', 'Jane Austen', 'Charlotte Brontë', 'Mary Shelley', 'George Eliot'],
        ['What is a soliloquy?', 'A speech a character gives alone on stage', 'A conversation between two characters', 'A narrator’s introduction', 'A closing scene'],
        ['Who wrote “Beloved”?', 'Toni Morrison', 'Alice Walker', 'Zora Neale Hurston', 'Maya Angelou'],
        ['How many lines does a sonnet have?', '14', '12', '16', '10'],
        ['What is an unreliable narrator?', 'A narrator whose account cannot be fully trusted', 'A narrator who speaks in third person', 'A narrator who dies', 'A narrator who is a child']
      ]
    }
  },

  animals: {
    name: 'Animals & Nature', emoji: '\u{1f43e}', tint: '#7ee08a',
    sets: {
      early: [
        ['What sound does a cow make?', 'Moo', 'Woof', 'Meow', 'Quack'],
        ['Which animal has a long trunk?', 'An elephant', 'A zebra', 'A rabbit', 'A tiger'],
        ['What is a baby dog called?', 'A puppy', 'A kitten', 'A cub', 'A calf'],
        ['Which animal is the fastest runner on land?', 'The cheetah', 'The horse', 'The rabbit', 'The dog'],
        ['How many legs does a spider have?', '8', '6', '4', '10'],
        ['Which animal lives in a hive?', 'A bee', 'A bear', 'A bird', 'A bat'],
        ['What do pandas mostly eat?', 'Bamboo', 'Fish', 'Grass', 'Nuts'],
        ['Which animal hops and carries its baby in a pouch?', 'A kangaroo', 'A monkey', 'A koala bear cub', 'A deer'],
        ['What is a baby cat called?', 'A kitten', 'A puppy', 'A foal', 'A chick'],
        ['Which bird cannot fly?', 'A penguin', 'An eagle', 'A robin', 'A sparrow'],
        ['Where do fish live?', 'In water', 'In trees', 'Underground', 'In the sky'],
        ['What do caterpillars turn into?', 'Butterflies', 'Birds', 'Beetles', 'Bees']
      ],
      elementary: [
        ['What is the largest animal on Earth?', 'The blue whale', 'The elephant', 'The giraffe', 'The great white shark'],
        ['How many hearts does an octopus have?', '3', '1', '2', '5'],
        ['What do you call a group of lions?', 'A pride', 'A pack', 'A herd', 'A flock'],
        ['Which animal has the longest neck?', 'The giraffe', 'The ostrich', 'The camel', 'The llama'],
        ['Are dolphins fish or mammals?', 'Mammals', 'Fish', 'Reptiles', 'Amphibians'],
        ['What is a baby kangaroo called?', 'A joey', 'A cub', 'A kit', 'A pup'],
        ['Which insect makes honey?', 'The honeybee', 'The wasp', 'The ant', 'The beetle'],
        ['How does a chameleon protect itself?', 'By changing color', 'By playing dead', 'By spraying ink', 'By digging'],
        ['What is the tallest bird in the world?', 'The ostrich', 'The eagle', 'The flamingo', 'The pelican'],
        ['Which animal is known for building dams?', 'The beaver', 'The otter', 'The badger', 'The mole'],
        ['What do we call animals that eat both plants and meat?', 'Omnivores', 'Herbivores', 'Carnivores', 'Decomposers'],
        ['Which sea creature has eight arms?', 'The octopus', 'The squid', 'The starfish', 'The jellyfish']
      ],
      middle: [
        ['What do we call an animal that is active at night?', 'Nocturnal', 'Diurnal', 'Migratory', 'Dormant'],
        ['What is the process of a caterpillar becoming a butterfly called?', 'Metamorphosis', 'Germination', 'Hibernation', 'Regeneration'],
        ['Which mammal is capable of true flight?', 'The bat', 'The flying squirrel', 'The sugar glider', 'The colugo'],
        ['What do we call an animal with a backbone?', 'A vertebrate', 'An invertebrate', 'An arthropod', 'A mollusk'],
        ['What is a food chain?', 'The order of who eats whom in an ecosystem', 'A list of animal names', 'A cycle of seasons', 'A map of habitats'],
        ['An octopus belongs to which group?', 'Cephalopods', 'Crustaceans', 'Echinoderms', 'Fish'],
        ['What is camouflage?', 'Coloring that helps an animal blend in', 'A loud warning call', 'A migration route', 'A type of nest'],
        ['Cold-blooded animals are also called what?', 'Ectotherms', 'Endotherms', 'Herbivores', 'Mammals'],
        ['Frogs belong to which animal group?', 'Amphibians', 'Reptiles', 'Fish', 'Mammals'],
        ['What is the scientific study of animals called?', 'Zoology', 'Botany', 'Geology', 'Ecology'],
        ['What is a keystone species?', 'A species an ecosystem depends on heavily', 'The largest animal in a habitat', 'A newly discovered species', 'An extinct species'],
        ['What does biodiversity measure?', 'The variety of life in an area', 'The total rainfall', 'The size of a forest', 'The age of a habitat']
      ]
    }
  },

  space: {
    name: 'Space', emoji: '\u{1f680}', tint: '#8f9cff',
    sets: {
      elementary: [
        ['How many planets are in our solar system?', '8', '9', '7', '10'],
        ['What is the closest star to Earth?', 'The Sun', 'Polaris', 'Sirius', 'Alpha Centauri'],
        ['Which planet is known as the Red Planet?', 'Mars', 'Venus', 'Jupiter', 'Mercury'],
        ['What do we call a space rock that burns up in our atmosphere?', 'A meteor', 'A comet', 'A planet', 'A satellite'],
        ['Which planet has the most visible rings?', 'Saturn', 'Jupiter', 'Uranus', 'Neptune'],
        ['What keeps the planets in orbit around the Sun?', 'Gravity', 'Magnetism', 'Wind', 'Light'],
        ['How long does Earth take to orbit the Sun once?', 'One year', 'One day', 'One month', 'One week'],
        ['What is an astronaut?', 'A person trained to travel in space', 'A kind of telescope', 'A type of rocket', 'A moon rock'],
        ['The Moon’s light is really what?', 'Reflected sunlight', 'Its own fire', 'Starlight from Polaris', 'Glowing ice'],
        ['Which is the biggest planet in our solar system?', 'Jupiter', 'Saturn', 'Neptune', 'Earth'],
        ['What causes day and night on Earth?', 'Earth spinning on its axis', 'The Moon blocking the Sun', 'Clouds moving', 'The Sun turning off'],
        ['What do we call a group of stars that forms a pattern?', 'A constellation', 'A galaxy', 'A nebula', 'A cluster moon']
      ],
      middle: [
        ['Which galaxy is Earth in?', 'The Milky Way', 'Andromeda', 'The Whirlpool Galaxy', 'The Triangulum Galaxy'],
        ['What is a light-year?', 'The distance light travels in one year', 'The time light takes to reach Earth', 'A year on another planet', 'The brightness of a star'],
        ['What causes the phases of the Moon?', 'The Moon’s position relative to Earth and the Sun', 'Earth’s shadow every night', 'Clouds covering the Moon', 'The Moon changing shape'],
        ['What is a black hole?', 'A region whose gravity is so strong light cannot escape', 'An empty patch of space', 'A dying planet', 'A hole in the atmosphere'],
        ['Which planet is the hottest in our solar system?', 'Venus', 'Mercury', 'Mars', 'Jupiter'],
        ['Which famous telescope launched in 1990 and orbits Earth?', 'The Hubble Space Telescope', 'The Kepler Telescope', 'The Webb Telescope', 'The Spitzer Telescope'],
        ['The asteroid belt lies between which two planets?', 'Mars and Jupiter', 'Earth and Mars', 'Jupiter and Saturn', 'Venus and Earth'],
        ['Why do astronauts appear to float in orbit?', 'They are in continuous free fall', 'There is no gravity in space', 'Their suits are filled with helium', 'The station spins fast'],
        ['What is a solar eclipse?', 'The Moon passing between Earth and the Sun', 'Earth passing between the Sun and Moon', 'The Sun cooling briefly', 'A planet crossing the Moon'],
        ['Which NASA rover landed on Mars in 2021?', 'Perseverance', 'Curiosity', 'Opportunity', 'Spirit'],
        ['What is the International Space Station?', 'A crewed laboratory orbiting Earth', 'A base on the Moon', 'A telescope on Mars', 'A launch pad in Florida'],
        ['Which planet is farthest from the Sun?', 'Neptune', 'Uranus', 'Saturn', 'Pluto']
      ],
      high: [
        ['What does the Big Bang theory describe?', 'The universe expanding from a hot, dense state', 'A star exploding', 'The formation of the Moon', 'A collision of galaxies'],
        ['What is a supernova?', 'The explosion of a massive dying star', 'The birth of a planet', 'A comet passing the Sun', 'A solar storm'],
        ['Redshift in distant galaxies is evidence of what?', 'The universe expanding', 'Stars cooling down', 'Dark matter decaying', 'Gravity weakening'],
        ['What is the Kuiper Belt?', 'A ring of icy bodies beyond Neptune', 'A dust ring around Saturn', 'A band of asteroids near Mars', 'A cloud of comets around the Sun’s core'],
        ['What process powers a star?', 'Nuclear fusion', 'Nuclear fission', 'Chemical burning', 'Friction'],
        ['What is an exoplanet?', 'A planet orbiting a star other than the Sun', 'A planet with no moon', 'A dwarf planet', 'A rogue asteroid'],
        ['Roughly what is Earth’s escape velocity?', 'About 11.2 km per second', 'About 1.1 km per second', 'About 112 km per second', 'About 300 km per second'],
        ['What is dark matter?', 'Matter that does not emit light but exerts gravity', 'Empty space between galaxies', 'Burnt-out stars', 'A form of antimatter'],
        ['Which unit equals the average Earth–Sun distance?', 'The astronomical unit', 'The light-year', 'The parsec', 'The solar radius'],
        ['What is a neutron star?', 'An extremely dense collapsed stellar core', 'A star made of hydrogen only', 'A very young star', 'A star orbiting a black hole'],
        ['What is the habitable zone of a star?', 'The orbital range where liquid water can exist', 'The surface layer of a star', 'The region inside an asteroid belt', 'The area lit by a star at night'],
        ['What is the Doppler effect used for in astronomy?', 'Measuring how fast objects move toward or away', 'Measuring a star’s age', 'Counting planets', 'Mapping craters']
      ]
    }
  },

  tech: {
    name: 'Tech & Coding', emoji: '\u{1f4bb}', tint: '#4fe0d0',
    sets: {
      elementary: [
        ['What is the “brain” of a computer called?', 'The CPU', 'The mouse', 'The screen', 'The keyboard'],
        ['What does “www” stand for?', 'World Wide Web', 'Wide Web World', 'Web With Words', 'World Web Work'],
        ['Which device do you use to type?', 'A keyboard', 'A monitor', 'A speaker', 'A printer'],
        ['Why do you use a password?', 'To keep your account safe', 'To make the computer faster', 'To change the colors', 'To print pages'],
        ['What is an app?', 'A program you use on a device', 'A kind of cable', 'A computer screen', 'A password'],
        ['What does the “save” button do?', 'Stores your work so you can open it later', 'Deletes your work', 'Prints your work', 'Closes the computer'],
        ['What is the internet?', 'A worldwide network of connected computers', 'A single big computer', 'A kind of software', 'A type of screen'],
        ['Which of these is safe to share online?', 'Your favorite color', 'Your home address', 'Your password', 'Your phone number'],
        ['What does a printer do?', 'Puts your work onto paper', 'Stores files', 'Plays music', 'Connects to wifi'],
        ['What is a robot?', 'A machine that can carry out tasks', 'A kind of website', 'A type of battery', 'A computer game'],
        ['What should you do if a message online feels scary or wrong?', 'Tell a trusted adult', 'Reply angrily', 'Share it with friends', 'Ignore it forever'],
        ['What does a mouse or trackpad let you do?', 'Point and click on things', 'Type letters', 'Charge the computer', 'Print documents']
      ],
      middle: [
        ['What does HTML stand for?', 'HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink Text Making Language'],
        ['What is an algorithm?', 'A step-by-step set of instructions', 'A type of computer', 'A programming language', 'A kind of file'],
        ['What is a variable in programming?', 'A named place to store a value', 'A repeated instruction', 'An error in code', 'A type of loop'],
        ['What does a loop do in code?', 'Repeats a set of instructions', 'Stops the program', 'Stores a value', 'Prints one line'],
        ['What is debugging?', 'Finding and fixing errors in code', 'Deleting a program', 'Writing documentation', 'Speeding up a computer'],
        ['What does CPU stand for?', 'Central Processing Unit', 'Computer Power Unit', 'Central Program Utility', 'Core Processing Underlayer'],
        ['Binary code is made of which two digits?', '0 and 1', '1 and 2', 'A and B', '0 and 9'],
        ['What is phishing?', 'A fake message that tries to steal your information', 'A way to speed up wifi', 'A programming technique', 'A kind of backup'],
        ['What does RAM stand for?', 'Random Access Memory', 'Rapid Active Memory', 'Read Access Mode', 'Run And Manage'],
        ['What is open source software?', 'Software whose code anyone can view and reuse', 'Software that is always free of bugs', 'Software only for schools', 'Software with no updates'],
        ['What is a conditional (if) statement used for?', 'Doing something only when a condition is true', 'Repeating code forever', 'Storing a list', 'Naming a function'],
        ['What is the cloud, in computing?', 'Servers on the internet that store and run things', 'Wifi signal in the air', 'A type of hard drive', 'A weather app']
      ],
      high: [
        ['What is Big-O notation used to describe?', 'How an algorithm scales with input size', 'How many bugs code has', 'The size of a file', 'The speed of a network'],
        ['What does API stand for?', 'Application Programming Interface', 'Applied Program Internet', 'Automatic Process Integration', 'Advanced Protocol Index'],
        ['What is a database index for?', 'Making lookups faster', 'Backing up data', 'Encrypting records', 'Sorting the screen'],
        ['What does HTTPS add over HTTP?', 'Encryption of the connection', 'Faster downloads', 'Better images', 'More storage'],
        ['What is recursion?', 'A function that calls itself', 'A loop inside a loop', 'A saved variable', 'A compiler error'],
        ['What is machine learning?', 'Programs that improve their behavior from data', 'Assembling computer hardware', 'A type of database', 'A networking protocol'],
        ['What does IP stand for in “IP address”?', 'Internet Protocol', 'Internal Process', 'Instant Ping', 'Indexed Packet'],
        ['What is version control used for?', 'Tracking changes to code over time', 'Compiling programs', 'Testing hardware', 'Encrypting passwords'],
        ['What is a compiler?', 'A program that translates source code into machine code', 'A debugger', 'A text editor', 'A file format'],
        ['What is a boolean value?', 'A value that is either true or false', 'A whole number', 'A piece of text', 'A list of items'],
        ['What is the difference between a stack and a queue?', 'A stack is last-in-first-out, a queue is first-in-first-out', 'A stack is sorted, a queue is not', 'A queue is faster than a stack', 'They are the same structure'],
        ['What does two-factor authentication add?', 'A second, separate proof of identity', 'A longer password', 'An extra username', 'A backup email only']
      ]
    }
  },

  arts: {
    name: 'Art & Music', emoji: '\u{1f3a8}', tint: '#ffb35c',
    sets: {
      elementary: [
        ['What are the three primary colors?', 'Red, blue and yellow', 'Green, orange and purple', 'Black, white and grey', 'Pink, brown and teal'],
        ['Who painted the Mona Lisa?', 'Leonardo da Vinci', 'Pablo Picasso', 'Claude Monet', 'Rembrandt'],
        ['How many strings does a standard guitar have?', '6', '4', '8', '12'],
        ['What do you call a group of musicians who play together?', 'A band or orchestra', 'A gallery', 'A chorus line', 'A studio'],
        ['What color do blue and yellow make?', 'Green', 'Purple', 'Orange', 'Brown'],
        ['Which instrument has black and white keys?', 'The piano', 'The violin', 'The flute', 'The drum'],
        ['What is a sculpture?', 'Art you can walk around and view from all sides', 'A painting on canvas', 'A photograph', 'A drawing in pencil'],
        ['What is a self-portrait?', 'A picture an artist makes of themselves', 'A picture of a landscape', 'A picture of an animal', 'A group photo'],
        ['What do we call how loud or soft music is?', 'Dynamics', 'Tempo', 'Melody', 'Harmony'],
        ['Which instrument belongs to the percussion family?', 'The drum', 'The trumpet', 'The cello', 'The clarinet'],
        ['What tool do painters mix colors on?', 'A palette', 'An easel', 'A kiln', 'A loom'],
        ['What do we call a picture made of small tiles or pieces?', 'A mosaic', 'A mural', 'A sketch', 'A collage frame']
      ],
      middle: [
        ['Who painted “The Starry Night”?', 'Vincent van Gogh', 'Claude Monet', 'Edvard Munch', 'Paul Cézanne'],
        ['What are the four families of the orchestra?', 'Strings, woodwinds, brass and percussion', 'Piano, guitar, drums and voice', 'Solo, duet, trio and quartet', 'Treble, bass, alto and tenor'],
        ['What does “forte” mean in music?', 'Loud', 'Soft', 'Fast', 'Slow'],
        ['Who sculpted the statue of David?', 'Michelangelo', 'Donatello', 'Bernini', 'Rodin'],
        ['What is a symphony?', 'A long orchestral work, usually in several movements', 'A short song for one voice', 'A dance for two', 'A painting technique'],
        ['What is perspective in drawing?', 'A way of making a flat picture look three-dimensional', 'Mixing complementary colors', 'Drawing only in outline', 'Using only warm colors'],
        ['Salvador Dalí is best known for which art movement?', 'Surrealism', 'Impressionism', 'Cubism', 'Realism'],
        ['How many lines are in a standard musical staff?', '5', '4', '6', '7'],
        ['What does tempo describe?', 'The speed of the music', 'The volume of the music', 'The key of the music', 'The instruments used'],
        ['What is a mural?', 'A painting made directly on a wall', 'A framed oil painting', 'A carved relief', 'A printed poster'],
        ['Which movement is Claude Monet associated with?', 'Impressionism', 'Cubism', 'Baroque', 'Pop art'],
        ['What are complementary colors?', 'Colors opposite each other on the color wheel', 'Colors next to each other on the wheel', 'Shades of the same color', 'Colors used only in printing']
      ]
    }
  },

  sports: {
    name: 'Sports', emoji: '⚽', tint: '#ff8a5c',
    sets: {
      elementary: [
        ['How many players from one basketball team are on the court at once?', '5', '6', '7', '4'],
        ['How many points is a touchdown worth in American football?', '6', '3', '7', '2'],
        ['Which sport uses a puck?', 'Ice hockey', 'Soccer', 'Tennis', 'Baseball'],
        ['How often are the Summer Olympic Games held?', 'Every four years', 'Every year', 'Every two years', 'Every ten years'],
        ['Which sport is played at Wimbledon?', 'Tennis', 'Golf', 'Cricket', 'Rowing'],
        ['How many players from one soccer team are on the field?', '11', '9', '10', '12'],
        ['In baseball, how many strikes make an out?', '3', '2', '4', '5'],
        ['What is the word for a score of zero in tennis?', 'Love', 'Nil', 'Duck', 'Blank'],
        ['Which sport uses a bat, a ball and four bases?', 'Baseball', 'Cricket', 'Softball golf', 'Rounders hockey'],
        ['About how long is a marathon?', '26.2 miles', '10 miles', '5 miles', '50 miles'],
        ['Which sport do you play on a balance beam?', 'Gymnastics', 'Diving', 'Wrestling', 'Fencing'],
        ['What do you call the person who enforces the rules in soccer?', 'The referee', 'The coach', 'The captain', 'The keeper']
      ],
      middle: [
        ['How many rings are on the Olympic flag?', '5', '4', '6', '7'],
        ['The FIFA World Cup is held in which sport?', 'Soccer', 'Rugby', 'Cricket', 'Basketball'],
        ['How many periods are in a standard ice hockey game?', '3', '2', '4', '5'],
        ['Which country hosted the first modern Olympic Games?', 'Greece', 'France', 'Italy', 'England'],
        ['How long is an Olympic swimming pool?', '50 meters', '25 meters', '100 meters', '75 meters'],
        ['What is a “hat trick”?', 'Three goals scored by one player in a game', 'Three saves in a row', 'A win by three points', 'Three players sent off'],
        ['How many volleyball players from one team are on the court?', '6', '5', '7', '8'],
        ['In basketball, how many points is a shot from beyond the arc?', '3', '2', '4', '1'],
        ['The Tour de France is a competition in which sport?', 'Cycling', 'Running', 'Sailing', 'Skiing'],
        ['What is the highest possible score in ten-pin bowling?', '300', '200', '250', '360'],
        ['What does “par” mean in golf?', 'The expected number of strokes for a hole', 'A score of zero', 'A missed shot', 'A tie between players'],
        ['In track, how many meters is a standard outdoor lap?', '400', '200', '500', '1000']
      ]
    }
  }
};
