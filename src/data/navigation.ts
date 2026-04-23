import { Category, Brand, Collection } from '../types';

export const mockBrands: Brand[] = [
  {
    id: 'b1',
    name: 'J&J Beauty',
    slug: 'jj-beauty',
    logo: 'https://picsum.photos/seed/jjbeauty/300/150',
    description: 'Une marque innovante pour sublimer votre beauté naturelle.'
  },
  {
    id: 'b2',
    name: 'Glow Botanics',
    slug: 'glow-botanics',
    logo: 'https://picsum.photos/seed/glowbotanics/300/150',
    description: 'Soins naturels infusés aux extraits botaniques.'
  }
];

export const mockCategories: Category[] = [
  {
    id: 'c-maquillage',
    name: 'Maquillage',
    slug: 'maquillage',
    description: 'Sublimez votre visage avec nos produits de maquillage',
    subcategories: [
      {
        id: 'c-maq-teint',
        name: 'Teint',
        slug: 'maquillage-teint',
        subcategories: [
          { id: 'c-maq-fond-de-teint', name: 'Fonds de teint', slug: 'fonds-de-teint' },
          { id: 'c-maq-anticernes', name: 'Anticernes', slug: 'anticernes' },
          { id: 'c-maq-poudres', name: 'Poudres', slug: 'poudres' },
          { id: 'c-maq-blush', name: 'Blush & Bronzers', slug: 'blush' }
        ]
      },
      {
        id: 'c-maq-yeux',
        name: 'Yeux',
        slug: 'maquillage-yeux',
        subcategories: [
          { id: 'c-maq-mascara', name: 'Mascaras', slug: 'mascaras' },
          { id: 'c-maq-palettes', name: 'Palettes', slug: 'palettes' },
          { id: 'c-maq-eyeliner', name: 'Eyeliners', slug: 'eyeliners' }
        ]
      },
      {
        id: 'c-maq-levres',
        name: 'Lèvres',
        slug: 'maquillage-levres',
        subcategories: [
          { id: 'c-maq-rouges', name: 'Rouges à lèvres', slug: 'rouges-a-levres' },
          { id: 'c-maq-gloss', name: 'Gloss', slug: 'gloss' },
          { id: 'c-maq-crayons-levres', name: 'Crayons à lèvres', slug: 'crayons-levres' }
        ]
      }
    ]
  },
  {
    id: 'c-soins',
    name: 'Soins',
    slug: 'soins',
    description: 'Une peau éclatante au quotidien',
    subcategories: [
      {
        id: 'c-soin-visage',
        name: 'Soins Visage',
        slug: 'soins-visage',
        subcategories: [
          { id: 'c-soin-nettoyants', name: 'Nettoyants', slug: 'nettoyants' },
          { id: 'c-soin-serums', name: 'Sérums', slug: 'serums' },
          { id: 'c-soin-cremes', name: 'Crèmes hydratantes', slug: 'cremes-hydratantes' },
          { id: 'c-soin-masques', name: 'Masques', slug: 'masques' }
        ]
      },
      {
        id: 'c-soin-corps',
        name: 'Soins Corps',
        slug: 'soins-corps',
        subcategories: [
          { id: 'c-soin-gels', name: 'Gels douche', slug: 'gels-douche' },
          { id: 'c-soin-lait', name: 'Laits & Crèmes', slug: 'laits-corps' },
          { id: 'c-soin-solaires', name: 'Solaires', slug: 'solaires' }
        ]
      }
    ]
  }
];

export const mockCollections: Collection[] = [
  {
    id: 'col-summer',
    name: 'Summer Escapade 2026',
    slug: 'summer-escapade-2026',
    image: 'https://picsum.photos/seed/summer/600/800',
    description: 'Une sélection légère et fluide pour vos vacances.'
  },
  {
    id: 'col-office',
    name: 'Back to Office',
    slug: 'back-to-office',
    image: 'https://picsum.photos/seed/office/600/800',
    description: 'Les indispensables pour une rentrée élégante.'
  }
];
