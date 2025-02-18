
import React from 'react';
import { Image, FileText, Video, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
interface FileCategoriesProps {
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  categories: {
    name: string;
    count: number;
  }[];
}

const categoryIcons = {
  image: Image,
  document: FileText,
  video: Video,
  other: File,
};

const FileCategories = ({
  selectedCategory,
  onCategorySelect,
  categories,
}: FileCategoriesProps) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Categories</h3>
      <div className="space-y-1">
        <Button
          variant={selectedCategory === null ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onCategorySelect(null)}
        >
          <File className="mr-2 h-4 w-4" />
          {t("fileExplorer.categories.allFiles")}
        </Button>
        {categories.map((category) => {
          const Icon = categoryIcons[category.name as keyof typeof categoryIcons];
          return (
            <Button
              key={category.name}
              variant={selectedCategory === category.name ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => onCategorySelect(category.name)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {t(`fileExplorer.categories.${category.name}`)}
              <span className="ml-auto text-xs text-muted-foreground">
                {category.count}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default FileCategories;
