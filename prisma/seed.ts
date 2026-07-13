import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import services from '../../src/data/services';
import { sectors } from '../../src/data/sectors';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run seed.');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const plainPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !plainPassword) {
    throw new Error(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required to run seed.',
    );
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  const admin =
    existingAdmin ??
    (await prisma.user.create({
      data: {
        email: adminEmail,
        password: await bcrypt.hash(plainPassword, 10),
        role: 'ADMIN',
      },
    }));

  await seedBlogData(admin.id);
  await seedSolutionsData();
  await seedSampleActivity();
}

async function seedBlogData(adminId: string) {
  const categories = await Promise.all(
    [
      { name: 'Network Infrastructure', slug: 'network-infrastructure' },
      { name: 'Cybersecurity', slug: 'cybersecurity' },
    ].map((category) =>
      prisma.category.upsert({
        where: { slug: category.slug },
        update: category,
        create: category,
      }),
    ),
  );

  const tags = await Promise.all(
    [
      { name: 'Enterprise', slug: 'enterprise' },
      { name: 'Cloud', slug: 'cloud' },
      { name: 'Managed Services', slug: 'managed-services' },
    ].map((tag) =>
      prisma.tag.upsert({
        where: { slug: tag.slug },
        update: tag,
        create: tag,
      }),
    ),
  );

  const postCount = await prisma.post.count();
  if (postCount > 0) return;

  const [networking, security] = categories;

  await prisma.post.create({
    data: {
      title: 'Modernizing Enterprise Networks in 2026',
      slug: 'modernizing-enterprise-networks-2026',
      excerpt:
        'Key lessons from recent Smoothtel deployments when upgrading legacy LAN/WAN footprints.',
      content:
        'We recently completed multiple network refreshes across East Africa. This recap shares the reference architectures, tooling choices, and rollout playbook we use to minimize downtime.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      authorId: adminId,
      categoryId: networking.id,
      tags: {
        create: tags.slice(0, 2).map((tag) => ({
          tag: { connect: { id: tag.id } },
        })),
      },
    },
  });

  await prisma.post.create({
    data: {
      title: 'Zero Trust Playbook for Regional Operators',
      slug: 'zero-trust-playbook',
      excerpt:
        'A practical sequence for rolling out zero trust controls across hybrid environments.',
      content:
        'Implementing zero trust in brownfield environments requires staged policies, telemetry, and executive sponsorship. This article outlines the decision framework we apply with our managed clients.',
      status: 'DRAFT',
      authorId: adminId,
      categoryId: security.id,
      tags: {
        create: tags.slice(1).map((tag) => ({
          tag: { connect: { id: tag.id } },
        })),
      },
    },
  });
}

async function seedSolutionsData() {
  await Promise.all(
    services.map((service, index) =>
      prisma.solution.upsert({
        where: { slug: service.slug },
        update: {
          type: 'SERVICE',
          title: service.title,
          summary: service.summary,
          heroTitle: service.heroTitle,
          heroDescription: service.heroDescription,
          heroMedia: service.heroMedia,
          icon: service.icon,
          overview: service.overview,
          challenges: service.challenges,
          capabilities: service.capabilities,
          process: service.process,
          differentiators: service.differentiators,
          useCases: service.useCases,
          outcomes: service.outcomes,
          faqs: service.faqs,
          visualGallery: service.visualGallery,
          gallery: service.gallery,
          status: 'PUBLISHED',
          sortOrder: index,
        },
        create: {
          type: 'SERVICE',
          slug: service.slug,
          title: service.title,
          summary: service.summary,
          heroTitle: service.heroTitle,
          heroDescription: service.heroDescription,
          heroMedia: service.heroMedia,
          icon: service.icon,
          overview: service.overview,
          challenges: service.challenges,
          capabilities: service.capabilities,
          process: service.process,
          differentiators: service.differentiators,
          useCases: service.useCases,
          outcomes: service.outcomes,
          faqs: service.faqs,
          visualGallery: service.visualGallery,
          gallery: service.gallery,
          status: 'PUBLISHED',
          sortOrder: index,
        },
      }),
    ),
  );

  await Promise.all(
    sectors.map((sector, index) => {
      const slug = sector.name
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      return prisma.solution.upsert({
        where: { slug },
        update: {
          type: 'SECTOR',
          title: sector.name,
          summary: sector.description,
          heroTitle: sector.name,
          heroDescription: sector.description,
          status: 'PUBLISHED',
          sortOrder: index,
        },
        create: {
          type: 'SECTOR',
          slug,
          title: sector.name,
          summary: sector.description,
          heroTitle: sector.name,
          heroDescription: sector.description,
          status: 'PUBLISHED',
          sortOrder: index,
        },
      });
    }),
  );
}

async function seedSampleActivity() {
  const contactsCount = await prisma.contactRequest.count();
  if (contactsCount === 0) {
    await prisma.contactRequest.createMany({
      data: [
        {
          name: 'Jane Waweru',
          email: 'jane@example.com',
          message: 'Need a managed network assessment for 12 branches.',
          status: 'NEW',
        },
        {
          name: 'Samuel Kamau',
          email: 'samuel@example.com',
          message: 'Follow up on SOC deployment timeline.',
          status: 'RESPONDED',
          respondedAt: new Date(),
        },
      ],
    });
  }

  const subscriberCount = await prisma.subscriber.count();
  if (subscriberCount === 0) {
    await prisma.subscriber.createMany({
      data: [
        { email: 'ops@acme.co.ke', name: 'Acme Ops', isActive: true },
        { email: 'cto@finserve.africa', name: 'Finserve CTO', isActive: true },
        { email: 'legacy@example.com', name: 'Legacy Corp', isActive: false },
      ],
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
