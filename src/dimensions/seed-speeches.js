// Synthetic Soapbox-style speeches for the demo district. Project Soapbox
// (Mikva Challenge) asks students to research an issue that affects them or
// their community and speak about it. These are written for the demo: the
// students, the school surveys and every number in them are made up.

const T = [
  { topic: 'vaping', titles: ['Clouds in the Bathroom', 'Who Sold Us the Flavors?'],
    hooks: ['Last spring I walked into the bathroom between periods and could not see the mirror. It smelled like mango, and three kids from my P.E. class were passing a vape like it was gum.', 'My cousin started vaping in seventh grade. She told me it was just water vapor. Two years later she could not run a single lap without stopping.'],
    facts: ['When our class surveyed two hundred students at our school, almost one in four said they had tried a vape, and most said they first got one from an older friend.', 'The flavors are not an accident. Cotton candy and mango are not made for adults. They are made for people my age.'],
    community: 'The smoke shops near our school are closer than the library. Kids walk past three of them on the way home.',
    asks: ['I am asking the city council to stop new vape shops from opening within a thousand feet of a school.', 'I am asking our school to replace suspensions for vaping with real help to quit, because punishing kids has not worked.'] },
  { topic: 'safety', titles: ['Lockdown Drill', 'Practice for the Worst Day'],
    hooks: ['In third grade I learned how to hide under a desk without breathing loud. I learned it before I learned long division.', 'During our last lockdown drill, a girl in my class started crying and could not stop. Nobody told her it was a drill until it was over.'],
    facts: ['Students at our school sit through four lockdown drills a year, and in our class survey most of us said the drills make us more scared, not more ready.', 'Schools across the country spend money on cameras and metal detectors, but our school has one counselor for every five hundred students.'],
    community: 'Safety is not only locks. It is knowing there is an adult who will notice when something is wrong before it gets worse.',
    asks: ['I am asking the board to fund more counselors before it buys one more camera.', 'I am asking adults to talk to us after every drill, so we are not left alone with the fear.'] },
  { topic: 'period products', titles: ['The Tax on Being a Girl', 'Nobody Talks About This'],
    hooks: ['I have missed class because I did not have a pad and was too embarrassed to ask the office.', 'My mom has to choose sometimes between buying groceries and buying period products for me and my two sisters.'],
    facts: ['Period products are taxed in many places like they are a luxury, while other basic needs are not.', 'When our club stocked free products in two bathrooms, they were gone in four days. That tells you how many girls needed them.'],
    community: 'This is not a girls problem. It is a school problem, because a student who leaves class cannot learn.',
    asks: ['I am asking our district to put free products in every bathroom in every school, not only the nurse office.', 'I am asking you to sign our petition to end the tax on period products in our state.'] },
  { topic: 'phones and mental health', titles: ['Always On', 'Three A.M.'],
    hooks: ['I check my phone more than four hundred times a day. I know because I counted for one day and it scared me.', 'My best friend stopped eating lunch with us because of what people were posting about her at night.'],
    facts: ['In our class survey, most students said they sleep less than seven hours because they are on their phones after midnight.', 'Doctors say teenagers need eight to ten hours of sleep, and almost nobody I know gets that.'],
    community: 'We are the first kids who never got to turn it off. Nobody taught our parents how to help us with this either.',
    asks: ['I am asking our school to teach digital wellness as a real class, taught by students who have lived it.', 'I am asking every parent here to make one room in your house a phone-free room, starting tonight.'] },
  { topic: 'heat', titles: ['One Hundred and Four Degrees in Room 12', 'Too Hot to Think'],
    hooks: ['In September the thermometer in our math room said ninety-one degrees, and our teacher was teaching us fractions with sweat on her face.', 'My little brother came home from school with a headache every day in August. The nurse said it was the heat.'],
    facts: ['Research shows students score worse on tests on hot days, and the effect is bigger in schools without air conditioning.', 'Our neighborhood has almost no trees, so the blacktop around our school gets hotter than the parks on the other side of town.'],
    community: 'The schools that are hottest are in the neighborhoods that already have the least. That is not fair.',
    asks: ['I am asking the district to fix air conditioning in the oldest classrooms first.', 'I am asking the city to plant shade trees along our walking routes to school.'] },
  { topic: 'streets', titles: ['The Crosswalk on Fifth Street', 'Walking to School Should Not Be Dangerous'],
    hooks: ['Every morning I cross six lanes of traffic to get to school, and the walk signal lasts eleven seconds.', 'A boy from our school was hit by a car last year at the corner where I wait for the bus. He was okay, but he walks with a limp now.'],
    facts: ['We counted cars for one hour at the crosswalk by our school and saw forty-three drivers go through without stopping for people walking.', 'Most kids at our school walk or take the bus. Most of the money goes to roads for cars.'],
    community: 'If the street is not safe for a twelve-year-old, it is not safe for a grandmother either.',
    asks: ['I am asking the city to add a crossing guard and a longer walk signal at Fifth and Main.', 'I am asking you to come walk our route with us one morning and see it for yourself.'] },
  { topic: 'housing', titles: ['Moving Again', 'Rent Day'],
    hooks: ['I have gone to four schools in five years. Every time the rent went up, we moved, and every time I had to make new friends.', 'My family of six lives in a two bedroom apartment. I do my homework in the bathroom because it is the only quiet room.'],
    facts: ['In our class, more than half of us said our family worries about paying rent.', 'Every time a student changes schools in the middle of the year, they can fall months behind.'],
    community: 'When families get pushed out, the whole neighborhood loses its teachers, its coaches and its corner stores.',
    asks: ['I am asking the city council to protect families from huge rent increases.', 'I am asking our school to keep students who move inside the district at the same school if they want to stay.'] },
  { topic: 'immigration', titles: ['Papers', 'My Father’s Hands'],
    hooks: ['When I was nine my dad did not come home from work one night. I translated for my mom on the phone with the lawyer.', 'My parents crossed a border so I could sit in this classroom. Some days I am afraid to come to school because I do not know who will be home when I get back.'],
    facts: ['Many students in our school speak another language at home and translate for their families at the doctor and the bank.', 'Kids who are scared about their families miss more school, and the fear follows them into class.'],
    community: 'My community cooks your food, builds your houses and cleans your offices. We are not visitors here.',
    asks: ['I am asking our district to make every school a place where families can ask for help without fear.', 'I am asking you to learn the story of one immigrant family in your neighborhood this month.'] },
  { topic: 'library', titles: ['Closed at Five', 'The Only Quiet Place'],
    hooks: ['The public library near my house closes at five, and my mom gets home at seven. That was the only place I could do homework with internet.', 'I read my first chapter book in the library on Maple Street. Now it is only open three days a week.'],
    facts: ['In our survey, one in five students said they do not have reliable internet at home.', 'When library hours were cut, the students who lost the most were the ones with nowhere else to go.'],
    community: 'A library is a classroom, a cooling center and a safe place, all for free.',
    asks: ['I am asking the city to keep the Maple Street library open until eight on school nights.', 'I am asking you to get a library card this week and show the council that we use it.'] },
  { topic: 'food', titles: ['Two Buses to an Apple', 'What Is for Lunch'],
    hooks: ['To buy fresh fruit, my grandmother takes two buses. The closest store to our apartment sells chips and soda.', 'I eat breakfast and lunch at school every day. For a lot of us, school food is most of the food we eat.'],
    facts: ['Our neighborhood has four fast food places and no grocery store within walking distance.', 'When our school started a salad bar, more students chose vegetables than anyone expected.'],
    community: 'You cannot learn when you are hungry, and you cannot eat well when there is nothing good to buy.',
    asks: ['I am asking the district to cook more fresh meals in our kitchens and fewer frozen ones.', 'I am asking the city to bring a farmers market to our neighborhood on weekends.'] },
  { topic: 'bullying', titles: ['Screenshot', 'What We Do Not See'],
    hooks: ['Someone made a fake account with my name in eighth grade. For a month, people I did not know sent me messages telling me to disappear.', 'My little sister stopped wanting to go to school in fourth grade, and it took us months to find out why.'],
    facts: ['Most bullying now happens online, after school, where teachers cannot see it.', 'Students in our survey said they would report bullying if they could do it without their name on it.'],
    community: 'Every one of us has watched it happen and stayed quiet. Silence is how it keeps going.',
    asks: ['I am asking our school to create an anonymous way to report bullying that students actually trust.', 'I am asking each of you to be the one person who says something next time.'] },
  { topic: 'counselors', titles: ['One for Five Hundred', 'Who Do I Talk To?'],
    hooks: ['I waited three weeks to see a counselor. By then I had already stopped going to my first period class.', 'When my grandfather died, the only adult who noticed I was not okay was the lunch lady.'],
    facts: ['Experts recommend one counselor for every two hundred and fifty students. Our school has about one for every five hundred.', 'Counselors at our school spend much of their time on schedules and testing, not on students.'],
    community: 'Every student deserves one adult at school who knows their name and their story.',
    asks: ['I am asking the board to hire more counselors and protect their time for students.', 'I am asking teachers to take five minutes each week just to check in with one student.'] },
];

const pick = (arr, h) => arr[h % arr.length];

/** A speech for a student. style: 0 story-led, 1 evidence-led, 2 action-led. */
export function makeSpeech(i, { name }) {
  const h = (i * 2654435761) >>> 0;
  const t = T[h % T.length];
  const style = (h >>> 8) % 3;
  const hook = pick(t.hooks, h >>> 4), hook2 = pick(t.hooks, (h >>> 4) + 1);
  const fact = pick(t.facts, h >>> 6), fact2 = pick(t.facts, (h >>> 6) + 1);
  const ask = pick(t.asks, h >>> 10), ask2 = pick(t.asks, (h >>> 10) + 1);
  const open = `Good afternoon. My name is ${name}, and today I want to talk about ${t.topic}.`;
  const body = style === 0 ? [hook, hook2, t.community, fact, ask]
    : style === 1 ? [hook, fact, fact2, t.community, ask]
      : [hook, fact, t.community, ask, ask2, 'Do not clap for me. Do something.'];
  return { title: pick(t.titles, h >>> 12), topic: t.topic, text: [open, ...body, 'Thank you.'].join(' ') };
}
