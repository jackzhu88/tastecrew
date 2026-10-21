/** Offline demo entities so the UI works before a Qloo hackathon key arrives. */

export const MOCK_SEARCH = [
  { id: 'mock:artist:radiohead', name: 'Radiohead', type: 'urn:entity:artist', aliases: ['radio head'] },
  { id: 'mock:artist:kendrick', name: 'Kendrick Lamar', type: 'urn:entity:artist', aliases: ['kdot'] },
  { id: 'mock:movie:spirited', name: 'Spirited Away', type: 'urn:entity:movie', aliases: ['千と千尋'] },
  { id: 'mock:movie:parasite', name: 'Parasite', type: 'urn:entity:movie' },
  { id: 'mock:place:momofuku', name: 'Momofuku Noodle Bar', type: 'urn:entity:place' },
  { id: 'mock:brand:aesop', name: 'Aesop', type: 'urn:entity:brand' },
  { id: 'mock:tv:succession', name: 'Succession', type: 'urn:entity:tv_show' },
  { id: 'mock:book:dune', name: 'Dune', type: 'urn:entity:book' },
];

export const MOCK_ENTITIES = {
  'urn:entity:place': [
    {
      entity_id: 'mock:place:barboncino',
      name: 'Barboncino Pizza',
      properties: { address: 'Brooklyn, NY', cuisine: 'Neapolitan pizza', price_level: 2 },
      tags: [{ name: 'casual dining' }, { name: 'group friendly' }],
    },
    {
      entity_id: 'mock:place:xi_an',
      name: "Xi'an Famous Foods",
      properties: { address: 'New York, NY', cuisine: 'Shaanxi noodles', price_level: 1 },
      tags: [{ name: 'spicy' }, { name: 'quick bite' }],
    },
    {
      entity_id: 'mock:place:cafe_mogador',
      name: 'Cafe Mogador',
      properties: { address: 'East Village, NY', cuisine: 'Moroccan', price_level: 2 },
      tags: [{ name: 'brunch' }, { name: 'date night' }],
    },
    {
      entity_id: 'mock:place:jacobs_pickles',
      name: "Jacob's Pickles",
      properties: { address: 'Upper West Side, NY', cuisine: 'Southern comfort', price_level: 2 },
      tags: [{ name: 'loud' }, { name: 'sharing plates' }],
    },
    {
      entity_id: 'mock:place:russ_daughters',
      name: "Russ & Daughters Cafe",
      properties: { address: 'Lower East Side, NY', cuisine: 'Jewish appetizing', price_level: 2 },
      tags: [{ name: 'iconic' }, { name: 'seafood' }],
    },
  ],
  'urn:entity:movie': [
    {
      entity_id: 'mock:movie:everything',
      name: 'Everything Everywhere All at Once',
      properties: { year: 2022, genres: ['sci-fi', 'comedy'] },
      tags: [{ name: 'mind-bending' }],
    },
    {
      entity_id: 'mock:movie:past_lives',
      name: 'Past Lives',
      properties: { year: 2023, genres: ['drama', 'romance'] },
      tags: [{ name: 'intimate' }],
    },
    {
      entity_id: 'mock:movie:dune2',
      name: 'Dune: Part Two',
      properties: { year: 2024, genres: ['sci-fi', 'adventure'] },
      tags: [{ name: 'epic' }],
    },
  ],
  'urn:entity:artist': [
    {
      entity_id: 'mock:artist:fka',
      name: 'FKA twigs',
      properties: { genres: ['art pop', 'electronic'] },
      tags: [{ name: 'experimental' }],
    },
    {
      entity_id: 'mock:artist:tyler',
      name: 'Tyler, the Creator',
      properties: { genres: ['hip hop', 'alternative'] },
      tags: [{ name: 'genre-fluid' }],
    },
  ],
  'urn:entity:destination': [
    {
      entity_id: 'mock:dest:lisbon',
      name: 'Lisbon',
      properties: { country: 'Portugal' },
      tags: [{ name: 'food city' }, { name: 'walkable' }],
    },
    {
      entity_id: 'mock:dest:kyoto',
      name: 'Kyoto',
      properties: { country: 'Japan' },
      tags: [{ name: 'culture' }, { name: 'quiet' }],
    },
  ],
};
