'use client';

import debounce from 'lodash/debounce';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DocumentsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  tag: string;
  onTagChange: (value: string) => void;
}

export function DocumentsToolbar({
  search,
  onSearchChange,
  tag,
  onTagChange,
}: DocumentsToolbarProps) {
  const [inputValue, setInputValue] = useState(search);

  const debouncedSearchChange = useMemo(
    () => debounce(onSearchChange, 300),
    [onSearchChange],
  );

  function handleSearchChange(value: string) {
    setInputValue(value);
    debouncedSearchChange(value);
  }

  return (
    <div className="flex items-center gap-3">
      <InputGroup size="lg" className="flex-1">
        <InputGroupAddon>
          <Search className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search by name"
          value={inputValue}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </InputGroup>

      <Select value={tag} onValueChange={onTagChange}>
        <SelectTrigger size="default" className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All context</SelectItem>
          <SelectItem value="business">Business</SelectItem>
          <SelectItem value="domain">Domain</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
