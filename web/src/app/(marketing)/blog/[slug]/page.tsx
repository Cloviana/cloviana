import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { env } from '@/config/env';
import { paths } from '@/config/paths';
import { sanityClient } from '@/sanity/client';
import {
  POST_QUERY,
  POST_SLUGS_QUERY,
  type BlogPost,
} from '@/sanity/queries/post';
import { RELATED_POSTS_QUERY, type Post } from '@/sanity/queries/posts';

import { PostCard } from '../_components/post-card';

import { AuthorBio } from './_components/author-bio';
import { Content } from './_components/content';
import {
  getTableOfContents,
  TableOfContents,
} from './_components/table-of-contents';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const ARTICLE_GRID_CLASS =
  'grid grid-cols-1 justify-items-center xl:grid-cols-[220px_minmax(0,56rem)_220px] xl:justify-items-stretch xl:gap-3';

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs =
    await sanityClient.fetch<Array<{ slug: string }>>(POST_SLUGS_QUERY);
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;

  const post = await sanityClient.fetch<BlogPost | null>(
    POST_QUERY,
    { slug },
    { next: { revalidate: 60 } },
  );

  if (!post) return {};

  const title = `${post.seo?.metaTitle ?? post.title} — Cloviana`;
  const description = post.seo?.metaDescription ?? post.excerpt;
  const canonical =
    post.seo?.canonicalUrl ?? `${env.WEB_URL}${paths.blog.post.getHref(slug)}`;
  const image = post.thumbnail?.asset.url;

  return {
    title,
    description,
    robots: post.seo?.noIndex ? { index: false, follow: false } : undefined,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post._updatedAt,
      authors: post.author ? [post.author.name] : undefined,
      images: image ? [{ url: image, alt: post.thumbnail?.alt }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

function buildJsonLd(post: BlogPost, slug: string) {
  const url = `${env.WEB_URL}${paths.blog.post.getHref(slug)}`;
  const blogUrl = `${env.WEB_URL}/blog`;
  const organizationId = `${env.WEB_URL}/#organization`;
  const blogId = `${blogUrl}#blog`;
  const webpageId = `${url}#webpage`;
  const articleId = `${url}#article`;
  const breadcrumbId = `${url}#breadcrumb`;
  const faqId = `${url}#faq`;
  const authorId = post.author
    ? `${env.WEB_URL}/authors/${post.author.slug}#person`
    : organizationId;

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebPage',
      '@id': webpageId,
      url,
      name: post.title,
      isPartOf: { '@id': blogId },
      primaryImageOfPage: post.thumbnail
        ? { '@id': `${url}#primaryimage` }
        : undefined,
      breadcrumb: { '@id': breadcrumbId },
      mainEntity: { '@id': articleId },
    },
    {
      '@type': 'Blog',
      '@id': blogId,
      url: blogUrl,
      name: 'Cloviana Blog',
      publisher: { '@id': organizationId },
    },
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: 'Cloviana',
      url: env.WEB_URL,
      logo: {
        '@type': 'ImageObject',
        url: post.author?.image?.asset.url ?? `${env.WEB_URL}/logo-icon.png`,
      },
    },
    {
      '@type': 'Article',
      '@id': articleId,
      headline: post.title,
      description: post.excerpt,
      url,
      datePublished: post.publishedAt,
      dateModified: post._updatedAt,
      inLanguage: 'en',
      image: post.thumbnail
        ? {
            '@type': 'ImageObject',
            '@id': `${url}#primaryimage`,
            url: post.thumbnail.asset.url,
            width: 1200,
            height: 630,
          }
        : undefined,
      wordCount: post.content ? post.content.split(/\s+/).length : undefined,
      author: { '@id': authorId },
      publisher: { '@id': organizationId },
      keywords: post.topics.map((t) => t.name).join(', '),
      about: post.topics.map((t) => ({ '@type': 'Thing', name: t.name })),
      isPartOf: { '@id': blogId },
      mainEntityOfPage: { '@id': webpageId },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': breadcrumbId,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: env.WEB_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: blogUrl },
        { '@type': 'ListItem', position: 3, name: post.title, item: url },
      ],
    },
  ];

  if (post.author) {
    graph.push({
      '@type': 'Person',
      '@id': authorId,
      name: post.author.name,
      jobTitle: post.author.jobTitle ?? undefined,
      url: post.author.linkedinUrl ?? undefined,
      image: post.author.image?.asset.url,
    });
  }

  if (post.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': faqId,
      isPartOf: { '@id': webpageId },
      mainEntity: post.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

function serializeJsonLd(jsonLd: ReturnType<typeof buildJsonLd>) {
  return JSON.stringify(jsonLd).replace(/</g, '\\u003c');
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  const post = await sanityClient.fetch<BlogPost | null>(
    POST_QUERY,
    { slug },
    { next: { revalidate: 60 } },
  );

  if (!post) notFound();

  const relatedPosts = await sanityClient.fetch<Post[]>(
    RELATED_POSTS_QUERY,
    { currentId: post._id, topicIds: post.topics.map((t) => t._id) },
    { next: { revalidate: 60 } },
  );

  const jsonLd = buildJsonLd(post, slug);
  const tableOfContents = getTableOfContents(post.content);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <div className="padding-global mx-auto max-w-[90rem] py-8 md:py-12 lg:py-16">
        <article>
          {/* Content */}
          <div className={ARTICLE_GRID_CLASS}>
            <div className="hidden xl:block" />
            <header className="mb-6 w-full max-w-4xl md:mb-10 lg:mb-14">
              {post.thumbnail && (
                <div className="relative mb-6 h-48 w-full overflow-hidden rounded-lg md:mb-10 md:h-80 lg:h-96">
                  <Image
                    src={post.thumbnail.asset.url}
                    alt={post.thumbnail.alt}
                    fill
                    className="object-cover"
                    priority
                    placeholder="blur"
                    blurDataURL={post.thumbnail.asset.metadata.lqip}
                  />
                </div>
              )}
              <h1 className="font-display font-gambarino text-2xl tracking-tight md:text-3xl lg:text-4xl xl:text-5xl">
                {post.title}
              </h1>
              <p className="text-foreground-light mt-3 text-sm md:mt-4">
                <time dateTime={post.publishedAt}>
                  {dateFormatter.format(new Date(post.publishedAt))}
                </time>
                {post.author && <span> · {post.author.name}</span>}
              </p>
            </header>
            <div className="hidden xl:block" />
            <TableOfContents items={tableOfContents} />
            <div className="w-full max-w-4xl">
              <Content content={post.content} />
            </div>
            <div className="hidden xl:block" />
          </div>

          {/* Footer */}
          <div className={ARTICLE_GRID_CLASS}>
            <div className="hidden xl:block" />
            <div className="w-full max-w-4xl">
              {post.faqs.length > 0 && (
                <div className="prose prose-neutral mt-12 max-w-none">
                  <h2 className="font-gambarino font-medium">
                    Frequently Asked Questions
                  </h2>
                  <Accordion type="single" collapsible className="not-prose">
                    {post.faqs.map((faq) => (
                      <AccordionItem key={faq._key} value={faq._key}>
                        <AccordionTrigger className="py-5 text-left font-medium hover:no-underline hover:opacity-60">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="pb-3">
                          <p className="text-muted-foreground">{faq.answer}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
              {post.author && <AuthorBio author={post.author} />}
            </div>
            <div className="hidden xl:block" />
          </div>
        </article>
      </div>

      {relatedPosts.length > 0 && (
        <div className="padding-global mx-auto max-w-[1800px] py-12">
          <h2 className="font-gambarino mb-8 text-xl">More articles</h2>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((post) => (
              <li key={post._id}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
