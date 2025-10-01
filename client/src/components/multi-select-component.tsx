import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface MultiSelectProps {
  options: readonly string[] | string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  displayNames?: Record<string, string>; // Optional mapping for display names
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select items...',
  className,
  displayNames,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter((v) => v !== option)
      : [...value, option];
    onChange(newValue);
  };

  const handleRemove = (option: string) => {
    onChange(value.filter((v) => v !== option));
  };

  return (
    <div className={`flex flex-col gap-2 ${className || ''}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {value.length === 0 ? placeholder : `${value.length} selected`}
            <span className="ml-2 h-4 w-4 shrink-0 opacity-50">▼</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    onSelect={() => handleSelect(option)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        value.includes(option) ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    {displayNames?.[option] || option}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {displayNames?.[item] || item}
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="ml-1 rounded-full hover:bg-slate-200 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

