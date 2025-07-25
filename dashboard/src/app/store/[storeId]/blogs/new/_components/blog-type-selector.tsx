'use client';

import { useFormContext } from 'react-hook-form';

import { Card } from '@/components/layout';
import { cn } from '@/utils/cn';

import { CreateArticleFormValues } from '../provider';

const blogTypes = [
  {
    value: 'HOW_TO',
    name: 'How-to Guide',
    description:
      'A step-by-step instructional post that teaches the reader how to accomplish a specific task.',
  },
  {
    value: 'LISTICLE',
    name: 'Listicle',
    description:
      'An article organized as a numbered or bulleted list, ideal for quick, scannable tips.',
  },
];

export const BlogTypeSelector = () => {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<CreateArticleFormValues>();
  const selectedType = watch('type');
  const errorMessage = errors.type?.message;

  return (
    <Card>
      <div className="space-y-2">
        <h6 className="text-[13px] font-medium">Blog Type</h6>
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {blogTypes.map(({ value, name, description }) => {
            const isActive = value === selectedType;
            return (
              <li
                key={value}
                className={cn(
                  'rounded-md border px-2 py-1.5',
                  isActive && 'bg-surface-200/50 shadow-inner',
                )}
              >
                <label className="block cursor-pointer">
                  <input
                    type="radio"
                    value={value}
                    className="sr-only"
                    {...register('type', { required: 'Choose a type' })}
                  />
                  <div className="flex flex-col">
                    <h6 className="text-[13px] font-medium">{name}</h6>
                    <p className="text-xs text-foreground-light">
                      {description}
                    </p>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
        {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
      </div>
    </Card>
  );
};
