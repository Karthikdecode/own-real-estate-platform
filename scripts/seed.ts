import { AppDataSource } from '../apps/api/src/database/data-source.js';
import { PropertyEntity } from '../apps/api/src/database/entities/property.entity.js';
import { PropertyImageEntity } from '../apps/api/src/database/entities/property-image.entity.js';
import { UserEntity } from '../apps/api/src/database/entities/user.entity.js';
import { hashPassword } from '../apps/api/src/modules/auth/password.js';

const SAMPLE_PROPERTIES = [
  {
    title: 'Luxury 3 BHK High-Rise Apartment in Indiranagar',
    slug: 'luxury-3-bhk-high-rise-apartment-indiranagar-bangalore',
    description: 'Stunning modern 3 BHK apartment with private balcony overlooking the city skyline. Features Italian marble flooring, modular German kitchen, clubhouse access, swimming pool, and 24/7 security.',
    propertyType: 'apartment',
    listingType: 'sale',
    price: 18500000,
    city: 'Bengaluru',
    locality: 'Indiranagar',
    address: '100ft Road, Defence Colony, Indiranagar',
    pincode: '560038',
    latitude: 12.9784,
    longitude: 77.6408,
    bedrooms: 3,
    bathrooms: 3,
    areaSqft: 1850,
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Spacious 2 BHK Lakeview Flat in Whitefield',
    slug: 'spacious-2-bhk-lakeview-flat-whitefield-bangalore',
    description: 'Vastu compliant 2 BHK home located in a gated community close to ITPL and top international schools. Fully furnished with reserved covered parking.',
    propertyType: 'apartment',
    listingType: 'rent',
    price: 38000,
    city: 'Bengaluru',
    locality: 'Whitefield',
    address: 'Near Varthur Lake, Whitefield Main Road',
    pincode: '560066',
    latitude: 12.9698,
    longitude: 77.7499,
    bedrooms: 2,
    bathrooms: 2,
    areaSqft: 1250,
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Premium 4 BHK Independent Villa in Koramangala',
    slug: 'premium-4-bhk-independent-villa-koramangala-bangalore',
    description: 'Exclusive 4 BHK villa with private landscaped garden, home theatre, solar water heating and 3-car parking. Quiet residential enclave close to dining hubs.',
    propertyType: 'villa',
    listingType: 'sale',
    price: 45000000,
    city: 'Bengaluru',
    locality: 'Koramangala',
    address: '4th Block, Koramangala',
    pincode: '560034',
    latitude: 12.9352,
    longitude: 77.6245,
    bedrooms: 4,
    bathrooms: 4,
    areaSqft: 3600,
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Sea Facing 3 BHK Apartment in Bandra West',
    slug: 'sea-facing-3-bhk-apartment-bandra-west-mumbai',
    description: 'Spectacular Arabian sea view apartment in Bandra West. Contemporary interiors, automated home systems, private elevator foyer and world class amenities.',
    propertyType: 'apartment',
    listingType: 'sale',
    price: 68000000,
    city: 'Mumbai',
    locality: 'Bandra West',
    address: 'Carter Road, Bandra West',
    pincode: '400050',
    latitude: 19.0657,
    longitude: 72.8273,
    bedrooms: 3,
    bathrooms: 3,
    areaSqft: 1950,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Modern 1 BHK Studio Apartment in Andheri East',
    slug: 'modern-1-bhk-studio-apartment-andheri-east-mumbai',
    description: 'Chic, compact 1 BHK ideal for working professionals. Walking distance to Metro station and Western Express Highway. Modular fittings and 24hr power backup.',
    propertyType: 'apartment',
    listingType: 'rent',
    price: 32000,
    city: 'Mumbai',
    locality: 'Andheri East',
    address: 'JB Nagar, Andheri Kurla Road',
    pincode: '400059',
    latitude: 19.1136,
    longitude: 72.8697,
    bedrooms: 1,
    bathrooms: 1,
    areaSqft: 580,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Independent 3 BHK House in Anna Nagar',
    slug: 'independent-3-bhk-house-anna-nagar-chennai',
    description: 'Independent residential house with separate puja room, utility area and covered terrace. Located in peaceful neighborhood close to Anna Nagar Tower Park.',
    propertyType: 'independent_house',
    listingType: 'sale',
    price: 24000000,
    city: 'Chennai',
    locality: 'Anna Nagar',
    address: '2nd Avenue, Anna Nagar West',
    pincode: '600040',
    latitude: 13.0850,
    longitude: 80.2101,
    bedrooms: 3,
    bathrooms: 3,
    areaSqft: 2200,
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Cozy 2 BHK Flat Near IT Corridor OMR',
    slug: 'cozy-2-bhk-flat-it-corridor-omr-chennai',
    description: 'Semi-furnished 2 BHK apartment in gated township with gym, tennis court and supermarket inside campus. Super fast connectivity to Sholinganallur and TIDEL Park.',
    propertyType: 'apartment',
    listingType: 'rent',
    price: 22000,
    city: 'Chennai',
    locality: 'OMR',
    address: 'Rajiv Gandhi Salai, Thoraipakkam',
    pincode: '600097',
    latitude: 12.9348,
    longitude: 80.2312,
    bedrooms: 2,
    bathrooms: 2,
    areaSqft: 1100,
    images: [
      'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Residential Villa Plot in Hinjewadi Phase 1',
    slug: 'residential-villa-plot-hinjewadi-phase-1-pune',
    description: 'Clear title NA plot with PMRDA sanction. Ready for immediate construction of your dream bungalow. Underground electricity, water lines, and tar road completed.',
    propertyType: 'plot',
    listingType: 'sale',
    price: 6500000,
    city: 'Pune',
    locality: 'Hinjewadi',
    address: 'Behind Infosys Campus, Hinjewadi Phase 1',
    pincode: '411057',
    latitude: 18.5913,
    longitude: 73.7389,
    bedrooms: null,
    bathrooms: null,
    areaSqft: 2400,
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Luxurious 3 BHK Gated Society Flat in Gachibowli',
    slug: 'luxurious-3-bhk-gated-society-flat-gachibowli-hyderabad',
    description: 'South-facing 3 BHK in Hyderabad Financial District. 5-star clubhouse, squash courts, temperature-controlled pool, and 100% DG power backup.',
    propertyType: 'apartment',
    listingType: 'sale',
    price: 15500000,
    city: 'Hyderabad',
    locality: 'Gachibowli',
    address: 'Near DLF Cyber City, Gachibowli',
    pincode: '500032',
    latitude: 17.4401,
    longitude: 78.3489,
    bedrooms: 3,
    bathrooms: 3,
    areaSqft: 1780,
    images: [
      'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=1200&auto=format&fit=crop&q=80'
    ]
  }
];

async function seed() {
  console.log('Connecting to database...');
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(UserEntity);
  const propertyRepo = AppDataSource.getRepository(PropertyEntity);
  const imageRepo = AppDataSource.getRepository(PropertyImageEntity);

  console.log('Creating demo users...');
  let demoOwner = await userRepo.findOneBy({ email: 'owner@realestate.com' });
  if (!demoOwner) {
    demoOwner = userRepo.create({
      fullName: 'Vikram Sharma',
      email: 'owner@realestate.com',
      mobileNumber: '+919876543211',
      passwordHash: hashPassword('Password123!'),
      role: 'user',
      isVerified: true,
    });
    await userRepo.save(demoOwner);
  }

  let demoBuyer = await userRepo.findOneBy({ email: 'buyer@realestate.com' });
  if (!demoBuyer) {
    demoBuyer = userRepo.create({
      fullName: 'Priya Sundaram',
      email: 'buyer@realestate.com',
      mobileNumber: '+919876543212',
      passwordHash: hashPassword('Password123!'),
      role: 'user',
      isVerified: true,
    });
    await userRepo.save(demoBuyer);
  }

  console.log('Seeding properties...');
  for (const item of SAMPLE_PROPERTIES) {
    let prop = await propertyRepo.findOneBy({ slug: item.slug });
    if (!prop) {
      prop = propertyRepo.create({
        ownerId: demoOwner.id,
        title: item.title,
        slug: item.slug,
        description: item.description,
        propertyType: item.propertyType as any,
        listingType: item.listingType as any,
        price: item.price,
        city: item.city,
        locality: item.locality,
        address: item.address,
        pincode: item.pincode,
        latitude: item.latitude,
        longitude: item.longitude,
        bedrooms: item.bedrooms,
        bathrooms: item.bathrooms,
        areaSqft: item.areaSqft,
        status: 'published',
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 10 * 86400000)),
      });
      await propertyRepo.save(prop);

      // Add images
      let order = 0;
      for (const imgUrl of item.images) {
        const image = imageRepo.create({
          propertyId: prop.id,
          storageKey: imgUrl, // Storage provider or direct URL
          mimeType: 'image/jpeg',
          sizeBytes: 1024 * 500,
          displayOrder: order,
          isPrimary: order === 0,
        });
        await imageRepo.save(image);
        order++;
      }
    }
  }

  console.log('Seeding completed successfully!');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

