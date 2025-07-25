'use client';

import debounce from 'lodash.debounce';
import { useParams } from 'next/navigation';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useFormContext, useController } from 'react-hook-form';

import { Autocomplete, TextField } from '@/components/input';
import { Card } from '@/components/layout';
import { useGetKeywords } from '@/features/keywords/api/get-keywords';

import { CreateArticleFormValues } from '../provider';

export const TitleKeywordForm = () => {
  const { storeId } = useParams();
  const { data = [], isLoading: fetching } = useGetKeywords(storeId as string, {
    type: 'BLOG',
  });
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CreateArticleFormValues>();

  const options = useMemo(
    () => data.map(({ phrase, id }) => ({ label: phrase, value: id })),
    [data],
  );

  const {
    field: keywordField,
    fieldState: { error: keywordError },
  } = useController({
    name: 'keywordId',
    control,
    rules: { required: 'Primary Keyword is required' },
  });

  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    setFilteredOptions(options);
  }, [options]);

  const filterOptions = useMemo(
    () =>
      debounce((query: string) => {
        setFilteredOptions(
          query
            ? options.filter((o) => new RegExp(query, 'i').test(o.label))
            : options,
        );
        setLocalLoading(false);
      }, 300),
    [options],
  );

  useEffect(() => {
    return () => {
      filterOptions.cancel();
    };
  }, [filterOptions]);

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      setLocalLoading(true);
      filterOptions(value);
    },
    [filterOptions],
  );

  const handleSelect = useCallback(
    ([value = '']: string[]) => {
      keywordField.onChange(value);
      const match = options.find((o) => o.value === value);
      setInputValue(match?.label ?? '');
    },
    [keywordField, options],
  );

  return (
    <Card>
      <div className="space-y-4">
        <TextField
          size="md"
          label="Title"
          placeholder="Enter your blog's title here"
          {...register('title', { required: 'Title is required' })}
          error={errors.title?.message}
          type="text"
        />

        <Autocomplete
          textfield={
            <Autocomplete.TextField
              placeholder="Search by keyword"
              type="text"
              size="md"
              label="Primary Keyword"
              value={inputValue}
              onChange={(e) => handleInputChange(e.currentTarget.value)}
              autoComplete="off"
              helpText="Keywords come from your blog’s keyword list. If you don’t see what you need, go to the Keywords page to add it."
              error={keywordError?.message}
            />
          }
          loading={fetching || localLoading}
          options={filteredOptions}
          selected={keywordField.value ? [keywordField.value] : []}
          onSelect={handleSelect}
        />
      </div>
    </Card>
  );
};
