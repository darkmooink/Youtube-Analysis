import { Categories } from './categories';

async function seedData() {
  const defaultCategories = [
    { name: 'Spam/Scam', categoriser: 'bay' },
    { name: 'Toxic/Abusive', categoriser: 'bay' },
    { name: 'Hate Speech', categoriser: 'bay' },
    { name: 'Positive/Supportive', categoriser: 'bay' },
    { name: 'Constructive Criticism', categoriser: 'bay' },
    { name: 'Suggestions/Requests', categoriser: 'bay' },
    { name: 'Questions', categoriser: 'bay' },
    { name: 'Insights/Testimonials', categoriser: 'bay' },
  ];

  for (const cat of defaultCategories) {
    await Categories.findOrCreate({
      where: { name: cat.name },
      defaults: { categoriser: cat.categoriser },
    });
  }
}

export { seedData };