import { Product } from '../types';

const createDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

export const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Sérum Éclat Vitamine C',
    slug: 'serum-eclat-vitamine-c',
    category: 'Soins Visage',
    status: 'active',
    createdAt: createDateStr(2),
    updatedAt: createDateStr(2),
    tags: ['Eclat', 'Vitamine C'],
    brand: 'J&J Beauty',
    sku: 'JJB-SER-001',
    shortDescription: 'Sérum illuminateur à la vitamine C pure.',
    description: 'Ce sérum concentré à 15% de vitamine C pure ravive l\'éclat du teint, lisse le grain de peau et réduit visiblement les taches pigmentaires. Idéal pour une routine beauté matinale.',
    price: 45.00,
    originalPrice: 55.00,
    images: [
      'https://picsum.photos/seed/serum1/800/1000',
      'https://picsum.photos/seed/serum2/800/1000'
    ],
    rating: 4.8,
    reviewsCount: 124,
    dateAdded: createDateStr(2),
    isPopular: true,
    stock: 50,
    sizes: ['30ml'],
    colors: [],
    deliveryEstimate: 'Livraison estimée : 2 à 4 jours ouvrés',
    composition: 'Vitamine C 15%, Acide Hyaluronique, Extraits d\'Agrumes.',
    careInstructions: 'Conserver à l\'abri de la lumière.',
    features: [
      { label: 'Formule', value: '15% Vitamine C pure' },
      { label: 'Parfum', value: 'Sans parfum' },
      { label: 'Type', value: 'Testé dermatologiquement' }
    ]
  },
  {
    id: 'p2',
    name: 'Fond de Teint Fluide',
    slug: 'fond-de-teint-fluide',
    category: 'Maquillage',
    status: 'active',
    createdAt: createDateStr(5),
    updatedAt: createDateStr(5),
    tags: ['Teint', 'Couvrance'],
    brand: 'Glow Botanics',
    sku: 'GLW-FDT-002',
    shortDescription: 'Fond de teint léger couvrance modulable.',
    description: 'Un fond de teint enrichi en extraits botaniques qui unifie le teint tout en légèreté. Fini naturel et lumineux, tenue 24h.',
    price: 38.00,
    images: [
      'https://picsum.photos/seed/fdt1/800/1000',
      'https://picsum.photos/seed/fdt2/800/1000'
    ],
    rating: 4.6,
    reviewsCount: 89,
    dateAdded: createDateStr(5),
    isPopular: true,
    stock: 120,
    sizes: ['30ml'],
    colors: [{ name: 'Beige Clair', hex: '#f0e3d6' }, { name: 'Sable', hex: '#e2ccb4' }, { name: 'Doré', hex: '#cda886' }],
    deliveryEstimate: 'Livraison express : demain avant 13h',
    features: [
      { label: 'Fini', value: 'Lumineux' },
      { label: 'Tenue', value: '24h' }
    ]
  },
  {
    id: 'p3',
    name: 'Mascara Volume Intense',
    slug: 'mascara-volume-intense',
    category: 'Maquillage',
    status: 'active',
    createdAt: createDateStr(10),
    updatedAt: createDateStr(10),
    tags: ['Yeux', 'Volume'],
    brand: 'J&J Beauty',
    sku: 'JJB-MAS-003',
    shortDescription: 'Volume et longueur extrêmes en un seul geste.',
    description: 'Brosse innovante pour attraper chaque cil, formule ultra-noire et tenue infaillible sans faire de paquets.',
    price: 24.50,
    images: [
      'https://picsum.photos/seed/mascara1/800/1000'
    ],
    rating: 4.9,
    reviewsCount: 312,
    sizes: ['10ml'],
    colors: [{ name: 'Noir Profond', hex: '#000000' }],
    dateAdded: createDateStr(10),
    isPopular: true,
    stock: 200,
    deliveryEstimate: 'Livraison standard : 3-5 jours ouvrés',
    features: [
      { label: 'Volume', value: 'x10' },
      { label: 'Waterproof', value: 'Oui' }
    ]
  },
  {
    id: 'p4',
    name: 'Crème Hydratante Réparatrice',
    slug: 'creme-hydratante-reparatrice',
    category: 'Soins Visage',
    status: 'active',
    createdAt: createDateStr(1),
    updatedAt: createDateStr(1),
    tags: ['Hydratation', 'Ceramides'],
    brand: 'Glow Botanics',
    sku: 'GLW-CREM-004',
    shortDescription: 'Hydratation intense et barrière cutanée renforcée.',
    description: 'Enrichie en céramides et acide hyaluronique, cette crème désaltère la peau et la protège des agressions extérieures.',
    price: 52.00,
    originalPrice: 65.00,
    images: [
      'https://picsum.photos/seed/creme1/800/1000',
      'https://picsum.photos/seed/creme2/800/1000'
    ],
    rating: 4.7,
    reviewsCount: 201,
    sizes: ['50ml'],
    colors: [],
    dateAdded: createDateStr(1),
    isPopular: false,
    stock: 45,
    deliveryEstimate: 'Livraison estimée : 2 à 4 jours ouvrés',
    features: [
      { label: 'Ingrédients', value: 'Acide Hyaluronique, Céramides' },
      { label: 'Action', value: 'Réparatrice' }
    ]
  },
  {
    id: 'p5',
    name: 'Gommage Corps Sucre & Miel',
    slug: 'gommage-corps-sucre-miel',
    category: 'Corps & Bain',
    status: 'active',
    createdAt: createDateStr(30),
    updatedAt: createDateStr(30),
    tags: ['Gommage', 'Corps'],
    brand: 'Glow Botanics',
    sku: 'GLW-GOM-005',
    shortDescription: 'Exfoliation douce et nourrissante.',
    description: 'Un gommage gourmand qui élimine les cellules mortes tout en laissant un film protecteur et adoucissant sur la peau.',
    price: 28.00,
    images: [
      'https://picsum.photos/seed/gommage1/800/1000'
    ],
    rating: 4.5,
    reviewsCount: 56,
    dateAdded: createDateStr(30),
    isPopular: false,
    stock: 78,
    sizes: ['200ml'],
    colors: [],
    deliveryEstimate: 'Livraison standard : 3-5 jours ouvrés'
  },
  {
    id: 'p6',
    name: 'Palette Ombres à Paupières "Nudes"',
    slug: 'palette-ombres-a-paupieres-nudes',
    category: 'Maquillage',
    status: 'active',
    createdAt: createDateStr(45),
    updatedAt: createDateStr(45),
    tags: ['Nudes', 'Palette', 'Yeux'],
    brand: 'J&J Beauty',
    sku: 'JJB-PAL-006',
    shortDescription: '12 teintes intemporelles pour sublimer votre regard.',
    description: 'Pigmentation intense et texture soyeuse. Cette palette contient à la fois des finis mats, irisés et pailletés pour créer une multitude de looks.',
    price: 59.90,
    images: [
      'https://picsum.photos/seed/palette1/800/1000',
      'https://picsum.photos/seed/palette2/800/1000'
    ],
    rating: 4.8,
    reviewsCount: 420,
    dateAdded: createDateStr(45),
    isPopular: true,
    stock: 15,
    sizes: ['Taille Unique'],
    colors: [],
    deliveryEstimate: 'Livraison estimée : 2 à 4 jours ouvrés'
  },
  {
    id: 'p7',
    name: 'Rouge à Lèvres Mat Velours',
    slug: 'rouge-a-levres-mat-velours',
    category: 'Maquillage',
    status: 'active',
    createdAt: createDateStr(12),
    updatedAt: createDateStr(12),
    tags: ['Levres', 'Mat'],
    brand: 'J&J Beauty',
    sku: 'JJB-RAL-007',
    shortDescription: 'Couleur intense et confort sans dessécher.',
    description: 'Une formule longue tenue qui offre un fini mat velouté parfait, enrichie en huiles nourrissantes.',
    price: 22.00,
    originalPrice: 26.00,
    images: [
      'https://picsum.photos/seed/ral1/800/1000'
    ],
    rating: 4.4,
    reviewsCount: 110,
    dateAdded: createDateStr(12),
    isPopular: false,
    stock: 200,
    sizes: ['Standard'],
    colors: [{ name: 'Rouge Passion', hex: '#d91a2a' }, { name: 'Rose Nude', hex: '#e9a8a6' }, { name: 'Prune', hex: '#6b304c' }],
    deliveryEstimate: 'Livraison express : demain avant 13h'
  },
  {
    id: 'p8',
    name: 'Eau Micellaire Démaquillante',
    slug: 'eau-micellaire-demaquillante',
    category: 'Soins Visage',
    status: 'archived',
    createdAt: createDateStr(60),
    updatedAt: createDateStr(60),
    tags: ['Demaquillant'],
    brand: 'Glow Botanics',
    sku: 'GLW-EAU-008',
    shortDescription: 'Nettoie et apaise en un seul geste.',
    description: 'Démaquille efficacement le visage et les yeux, même les peaux les plus sensibles.',
    price: 15.50,
    images: [
      'https://picsum.photos/seed/eau1/800/1000'
    ],
    rating: 4.7,
    reviewsCount: 305,
    dateAdded: createDateStr(60),
    isPopular: true,
    stock: 0,
    sizes: ['400ml', '200ml'],
    colors: [],
    deliveryEstimate: 'Actuellement indisponible. Inscrivez-vous pour être alerté.'
  }
];
