import { 
  ChartBarIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface IconProps {
  name: 'chart' | 'plus' | 'edit' | 'delete' | 'close' | 'search';
  className?: string;
}

export default function Icon({ name, className = 'w-6 h-6' }: IconProps) {
  switch (name) {
    case 'chart':
      return <ChartBarIcon className={className} />;
    case 'plus':
      return <PlusIcon className={className} />;
    case 'edit':
      return <PencilIcon className={className} />;
    case 'delete':
      return <TrashIcon className={className} />;
    case 'close':
      return <XMarkIcon className={className} />;
    case 'search':
      return <MagnifyingGlassIcon className={className} />;
    default:
      return null;
  }
} 