// frontend/src/app/auth/signup_perusahaan/types.ts
export type Step = 1 | 2 | 3 | 4;

export type CompanyProfile = {
  logo?: string; // dataURL preview
  name: string;
  email: string;
  website?: string;
  industry?: string;
  size?: string;
  about?: string;
  address?: string;
  city?: string;
  socials: {
    website?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
  };
};

export type PackageId = 'free' | 'starter' | 'basic' | 'business' | 'premium';

export type Package = {
  id: PackageId;
  title: string;
  price: number; // IDR
  features: string[];
};

export type NewJob = {
  title: string;
  functionArea: string;
  level: string;
  type: 'full_time' | 'part_time' | 'contract' | 'internship';
  location: string;
  workMode: 'onsite' | 'remote' | 'hybrid';
  description: string;
  requirements: string;
  tags: string;
  deadline?: string;
};
