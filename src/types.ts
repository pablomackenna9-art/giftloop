export interface User {
  id: string;
  name: string;
  lastName: string;
  avatar: string;
  bio: string;
  birthday: string; // "MM-DD"
  following: boolean;
  followersCount: number;
  friendsCount: number;
  listsCount: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  url: string;
  liked: boolean;
  category: string;
  description?: string;
  note?: string;          // talla, color, preferencia del usuario
  isGroupFund?: boolean;  // marcar como fondo grupal
}

export interface WishList {
  id: string;
  name: string;
  emoji: string;
  products: Product[];
  isGroupFund?: boolean;
}

export interface GroupFund {
  id: string;
  name: string;
  product: Product;
  targetAmount: number;
  currentAmount: number;
  contributors: Contributor[];
  isOwner?: boolean;
}

export interface Contributor {
  user: User;
  amount: number;
  date: string;
}

export interface Event {
  id: string;
  type: 'baby_shower' | 'wedding' | 'birthday' | 'asado' | 'graduation';
  title: string;
  date: string;
  location: string;
  host: User;
  description: string;
  wishlist: Product[];
  attendees: User[];
  emoji: string;
}

export interface FeedItem {
  id: string;
  user: User;
  action: 'added' | 'liked' | 'created_list' | 'shared';
  product?: Product;
  listName?: string;
  timestamp: string;
}

export interface Message {
  id: string;
  fromId: string;
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  user: User;
  messages: Message[];
  unread: number;
}

export interface Brand {
  id: string;
  name: string;
  category: 'grandes_tiendas' | 'tecnologia' | 'hogar' | 'outdoor';
  logo: string;
  coverImage: string;
  description: string;
  filters: string[];
  products: Product[];
  color: string;
}

export interface WalletContribution {
  user: User;
  amount: number;
  date: string;
  giftName: string;
}

export type Screen = 'home' | 'discover' | 'search' | 'messages' | 'profile';

export type HomeSubView =
  | 'feed'
  | 'wallet_review'
  | 'wallet_withdraw'
  | 'birthdays_all'
  | 'event_detail'
  | 'friend_profile'
  | 'brand_store';

export type DiscoverSubView = 'main' | 'brand_store' | 'category';

export type ProfileTab = 'wishes' | 'lists' | 'group_funds' | 'add_product';
