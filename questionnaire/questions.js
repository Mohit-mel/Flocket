/*
 * Flocket brand discovery: the question set.
 *
 * Every question `id` becomes a column in the Google Sheet, so treat ids as
 * permanent. Rename the label freely; renaming an id starts a new column.
 * Scale questions write one column per pair: `<id>_<pair key>` (1 = left pole, 5 = right pole).
 *
 * Types
 *   text | email | longtext       free answers
 *   choice                        chips; multi, max, ordered, other are optional
 *   scale                         bipolar sliders, one per pair
 *   moods | palettes | type       visual cards (single unless multi/max set)
 *   ab                            two lines of copy, pick the one that sounds like Flocket
 */
window.FLOCKET_QUESTIONNAIRE = {
  chapters: [
    {
      id: 'intro',
      title: ['Before we begin', 'who are we talking to?'],
      blurb: 'Three quick details so we know who these answers come from.',
      bg: { src: 'bg-meadow' },
      skipIntro: true,
      questions: [
        { id: 'name', type: 'text', label: 'What should we call you?', placeholder: 'Your first name', required: true, autocomplete: 'given-name' },
        { id: 'role', type: 'text', label: 'And your role at Flocket?', placeholder: 'Co-founder, CEO', autocomplete: 'organization-title' },
        { id: 'email', type: 'email', label: 'Where should we send the brand brief?', placeholder: 'you@flocket.ai', required: true, autocomplete: 'email' },
      ],
    },
    {
      id: 'business',
      title: ['The business.', 'Why Flocket exists.'],
      blurb: 'The story behind the product, in your own words.',
      bg: { src: 'bg-lakeside' },
      questions: [
        { id: 'biz_one_liner', type: 'longtext', label: 'Describe Flocket in one sentence, the way you would to a friend over dinner.', help: 'No jargon. If it takes two sentences, that is fine too.', placeholder: 'Flocket is…' },
        { id: 'biz_origin', type: 'longtext', label: 'What was the moment you knew Flocket had to exist?', help: 'A conversation, a frustration, a customer. The more specific, the better.' },
        { id: 'biz_why_now', type: 'longtext', label: 'Why is now the right time for Flocket?' },
        { id: 'biz_five_years', type: 'longtext', label: 'It is 2031 and Flocket is a household name. What is it famous for?' },
        {
          id: 'biz_values', type: 'choice', multi: true, max: 3, other: true,
          label: 'Pick the three values Flocket would never compromise on.',
          options: ['Honesty', 'Craft', 'Speed', 'Simplicity', 'Autonomy', 'Generosity', 'Ambition', 'Calm', 'Curiosity', 'Accessibility', 'Rigour', 'Warmth'],
        },
      ],
    },
    {
      id: 'people',
      title: ['The people.', 'Who Flocket is for.'],
      blurb: 'The shop owners, marketers and makers the brand has to win over.',
      bg: { src: 'bg-hillside' },
      questions: [
        {
          id: 'aud_primary', type: 'choice', multi: true, max: 3, ordered: true, other: true,
          label: 'Who is Flocket for first?',
          help: 'Pick up to three, in order of priority. The number on each chip shows its rank.',
          options: ['Solopreneurs', 'First-time shop owners', 'D2C and e-commerce brands', 'Consultants and agencies', 'In-house brand managers', 'Editors and video producers', 'Creators', 'Local businesses', 'CMOs at larger companies'],
        },
        { id: 'aud_story', type: 'longtext', label: 'Describe one real customer, or the person you picture when you build.', help: 'What does their week look like, and where does marketing fall apart for them?' },
        {
          id: 'aud_feel_before', type: 'choice', multi: true, max: 3, other: true,
          label: 'How do they feel about marketing today?',
          options: ['Overwhelmed', 'Guilty they are not doing enough', 'Burned by agencies', 'Tired of juggling tools', 'Priced out', 'Curious about AI', 'Confident but stretched thin', 'Invisible online'],
        },
        { id: 'aud_feel_after', type: 'longtext', label: 'After a month with Flocket, finish this sentence for them: “Flocket made me feel…”' },
        {
          id: 'aud_ai_attitude', type: 'choice',
          label: 'How does your audience feel about AI?',
          options: ['Excited', 'Curious but cautious', 'Indifferent', 'Wary', 'It depends on the segment'],
        },
        {
          id: 'aud_lead_with_ai', type: 'choice',
          label: 'Should the brand lead with “AI”?',
          options: ['Yes, front and centre', 'Mention it, lead with outcomes', 'Keep the AI almost invisible'],
        },
      ],
    },
    {
      id: 'field',
      title: ['The field.', 'Where Flocket stands.'],
      blurb: 'How you want to be seen next to everyone else building in this space.',
      bg: { src: 'bg-alpine' },
      questions: [
        { id: 'pos_competitors', type: 'longtext', label: 'Blaze, NoimosAI, Fastlane, Pomelli and sitefire. Whose brand do you think works best, and what would you never copy from any of them?' },
        { id: 'pos_difference', type: 'longtext', label: 'If a customer could remember only one thing that makes Flocket different, what should it be?' },
        {
          id: 'pos_role', type: 'choice', other: true,
          label: 'Which role describes Flocket best?',
          help: 'The deck calls it “the CMO who writes the instructions.”',
          options: ['A chief marketing officer', 'A whole marketing team', 'A trusted colleague', 'A creative studio', 'An operating system for growth', 'A co-pilot'],
        },
        {
          id: 'pos_price_feel', type: 'choice',
          label: 'Plans run from free to $499 a month. Where should the brand feel like it sits?',
          options: ['Friendly and accessible', 'Smart value', 'Premium and worth it', 'Enterprise grade'],
        },
        { id: 'pos_not', type: 'longtext', label: 'What is Flocket not? List anything you never want to be mistaken for.', placeholder: 'e.g. another chatbot, a cheap content mill…' },
      ],
    },
    {
      id: 'personality',
      title: ['The personality.', 'How Flocket shows up.'],
      blurb: 'If the brand were a person, what would it be like to spend a day with?',
      bg: { src: 'bg-wildflowers' },
      questions: [
        {
          id: 'pers', type: 'scale',
          label: 'Drag each slider toward the side that feels more like Flocket.',
          help: 'The middle means “a bit of both.” Leave a slider alone to skip it.',
          pairs: [
            { key: 'playful_serious', left: 'Playful', right: 'Serious' },
            { key: 'friendly_authoritative', left: 'Friendly', right: 'Authoritative' },
            { key: 'calm_energetic', left: 'Calm', right: 'Energetic' },
            { key: 'timeless_trendy', left: 'Timeless', right: 'Trend-led' },
            { key: 'minimal_expressive', left: 'Minimal', right: 'Expressive' },
            { key: 'human_technical', left: 'Human', right: 'Technical' },
            { key: 'accessible_exclusive', left: 'Accessible', right: 'Exclusive' },
            { key: 'quiet_loud', left: 'Quiet', right: 'Loud' },
          ],
        },
        { id: 'pers_person', type: 'longtext', label: 'If Flocket walked into a room, who would it be?', help: 'A real or fictional person. How do they dress, talk, and treat people?' },
        { id: 'pers_words_love', type: 'text', label: 'Three words you would love customers to use about Flocket.', placeholder: 'Calm, sharp, generous' },
        { id: 'pers_words_hate', type: 'text', label: 'Three words you would hate to hear.', placeholder: 'Gimmicky, cold, salesy' },
      ],
    },
    {
      id: 'name',
      title: ['The name and mark.', 'What we keep, what we change.'],
      blurb: 'Your name, your chevrons, and the flock that runs through the deck.',
      bg: { src: 'bg-mist' },
      questions: [
        { id: 'name_meaning', type: 'longtext', label: 'What does the name “Flocket” mean to you?', help: 'A flock? A pocket? A rocket? Something only the founders know?' },
        {
          id: 'name_written', type: 'choice',
          label: 'How should the name be written?',
          options: ['Flocket', 'Flocket.ai', 'Flocket AI', 'Not sure yet'],
        },
        {
          id: 'mark_current', type: 'choice', showMark: true,
          label: 'How do you feel about the current mark?',
          options: ['Love it, keep it', 'Keep the idea, refine it', 'Open to something new', 'Start fresh'],
        },
        {
          id: 'mark_flock', type: 'choice',
          label: 'Birds flying in formation run through your deck. How central should the flock be?',
          options: ['It is the heart of the brand', 'A supporting motif', 'Nice, not essential', 'Move away from it'],
        },
        { id: 'mark_taglines', type: 'longtext', label: 'Any taglines or phrases you already love?', placeholder: 'e.g. “Not a tool that helps you market. A colleague who does the marketing.”' },
      ],
    },
    {
      id: 'look',
      title: ['The look.', 'What Flocket feels like.'],
      blurb: 'Gut reactions are perfect here. Pick what pulls you in.',
      bg: { src: 'bg-sunlit' },
      questions: [
        {
          id: 'vis_mood', type: 'moods', multi: true, max: 2,
          label: 'Which worlds feel most like Flocket?',
          help: 'Pick up to two.',
          options: [
            { value: 'Painted calm', caption: 'Hand-painted skies, soft light, the deck as it is today.' },
            { value: 'Swiss precision', caption: 'Strict grid, bold geometry, one sharp colour.' },
            { value: 'Warm editorial', caption: 'Serif headlines, paper tones, magazine pacing.' },
            { value: 'Electric future', caption: 'Dark glass, glowing gradients, product-first.' },
            { value: 'Playful pop', caption: 'Chunky shapes, loud colour, a wink in every line.' },
            { value: 'Quiet luxury', caption: 'Stone, linen, restraint. Premium without shouting.' },
          ],
        },
        {
          id: 'vis_painted', type: 'choice',
          label: 'Your deck is built on painted landscapes like the one behind this card. Where should they go?',
          options: ['Keep them, they are us', 'Evolve them', 'Use them sparingly', 'Retire them'],
        },
        {
          id: 'vis_palette', type: 'palettes', multi: true, max: 2,
          label: 'Which palettes are you drawn to?',
          help: 'Pick up to two.',
          options: [
            { value: 'Meadow', colors: ['#eaf4ff', '#9cc8f0', '#4f8f3a', '#1f4d2b', '#b6ef3e'], caption: 'Sky, grass, and the lime from your app icon.' },
            { value: 'Blue hour', colors: ['#dbe6ff', '#6f8fe0', '#3a5bc7', '#1d2a63', '#f2c6a0'], caption: 'Cobalt evening with a warm horizon.' },
            { value: 'Sunrise', colors: ['#fff4e8', '#ffc9a3', '#ff8a65', '#c2453d', '#3b2a2a'], caption: 'Peach, coral and ember.' },
            { value: 'Ink and leaf', colors: ['#ffffff', '#e6e8e5', '#9aa39d', '#141a17', '#38c25d'], caption: 'Monochrome with one living green.' },
            { value: 'Electric', colors: ['#0b0f14', '#16202b', '#2ee6c8', '#c6ff3d', '#f5f7fa'], caption: 'Dark, glowing, product-led.' },
            { value: 'Earth', colors: ['#f3ede2', '#d8c3a5', '#a2774c', '#5f6b3c', '#2d2a24'], caption: 'Clay, sand and olive.' },
          ],
        },
        { id: 'vis_colors_avoid', type: 'text', label: 'Any colours that are off-limits?', placeholder: 'e.g. purple, anything neon' },
        {
          id: 'vis_type', type: 'type',
          label: 'Which typeface sounds most like Flocket speaking?',
          options: [
            { value: 'Geometric sans', family: '"Poppins", sans-serif', weight: 500, caption: 'Round, friendly, modern. Your deck today.' },
            { value: 'Neo-grotesk', family: '"Inter Tight", sans-serif', weight: 600, caption: 'Neutral, precise, product-like.' },
            { value: 'Editorial serif', family: '"Instrument Serif", serif', weight: 400, caption: 'Literary, confident, a little classic.' },
            { value: 'Soft rounded', family: '"Nunito", sans-serif', weight: 800, caption: 'Warm, approachable, easy-going.' },
            { value: 'Technical mono', family: '"JetBrains Mono", monospace', weight: 500, caption: 'Built by engineers, and proud of it.' },
            { value: 'Expressive grotesk', family: '"Bricolage Grotesque", sans-serif', weight: 700, caption: 'Quirky, characterful, memorable.' },
          ],
        },
        {
          id: 'vis_imagery', type: 'choice', multi: true, other: true,
          label: 'What should the brand show in its imagery?',
          options: ['Painted illustration', 'Real customers and their shops', 'Product screens', '3D renders', 'Abstract shapes and patterns', 'Motion and video first'],
        },
      ],
    },
    {
      id: 'voice',
      title: ['The voice.', 'How Flocket talks.'],
      blurb: 'Four quick pairs. Pick the line that sounds like Flocket.',
      bg: { src: 'bg-meadow', flip: true, tint: 'golden' },
      questions: [
        {
          id: 'voice_headline', type: 'ab',
          label: 'Which headline sounds like Flocket?',
          options: ['Your marketing, handled. Go run your business.', 'AI-powered marketing automation for growing brands.'],
        },
        {
          id: 'voice_product', type: 'ab',
          label: 'Flocket spots something in the numbers. Which message sounds right?',
          options: ['Your Tuesday posts do three times better. Want me to move Friday’s?', 'Insight: engagement peaks on Tuesdays. Rescheduling is recommended.'],
        },
        {
          id: 'voice_greeting', type: 'ab',
          label: 'Monday morning. How does Flocket say hello?',
          options: ['Hey! Ready to make some magic this week? ✨', 'Morning. Here’s what I’d do this week.'],
        },
        {
          id: 'voice_pitch', type: 'ab',
          label: 'Which line would you put on the homepage?',
          options: ['Built for the half of all businesses that have nobody doing marketing.', 'Enterprise-grade marketing for businesses of every size.'],
        },
        {
          id: 'voice_humour', type: 'choice',
          label: 'How much humour belongs in the brand?',
          options: ['None', 'A light touch', 'Dry and witty', 'Full personality'],
        },
        {
          id: 'voice_markets', type: 'choice', multi: true, other: true,
          label: 'Which languages and markets matter on day one?',
          options: ['English, global', 'English, India', 'Hindi', 'Hinglish', 'English, US', 'English, UK'],
        },
      ],
    },
    {
      id: 'wrap',
      title: ['Inspiration and logistics.', 'The last stretch.'],
      blurb: 'Brands you admire, what you need first, and who signs off.',
      bg: { src: 'bg-bluehour' },
      questions: [
        { id: 'insp_admire', type: 'longtext', label: 'Which brands do you admire, in any industry? What do they get right?' },
        { id: 'insp_dislike', type: 'longtext', label: 'Any brands that put you off? Why?' },
        { id: 'insp_links', type: 'longtext', label: 'Share links to anything you have saved.', help: 'Websites, posts, Pinterest boards, a Google Drive folder. One per line is perfect.', placeholder: 'https://' },
        {
          id: 'deliv_first', type: 'choice', multi: true, other: true,
          label: 'What do you need first?',
          options: ['Logo and mark', 'Colour and type system', 'Website', 'Product UI refresh', 'Pitch deck', 'Social templates', 'Launch video and motion', 'Brand guidelines', 'Merch'],
        },
        {
          id: 'deliv_timeline', type: 'choice',
          label: 'When does the new brand need to be live?',
          help: 'The deck puts launch about four months out.',
          options: ['Within 4 weeks', 'In 1 to 2 months', 'In 3 to 4 months, before launch', 'No fixed date'],
        },
        { id: 'deliv_signoff', type: 'text', label: 'Who signs off on the brand?', placeholder: 'Names and roles' },
        { id: 'deliv_anything', type: 'longtext', label: 'Anything else we should know?' },
      ],
    },
  ],
};
