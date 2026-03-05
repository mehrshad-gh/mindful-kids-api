import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getDomainColor } from '../../design/colors';

const DOMAIN_ICONS: Record<string, string> = {
  emotional_awareness: 'heart-outline',
  self_regulation: 'leaf-outline',
  problem_solving: 'bulb-outline',
  social_connection: 'people-outline',
  resilience: 'trending-up-outline',
};

interface DomainIconProps {
  domainId: string;
  size?: number;
  color?: string;
}

export function DomainIcon({ domainId, size = 24, color }: DomainIconProps) {
  const name = DOMAIN_ICONS[domainId] ?? 'ellipse-outline';
  const iconColor = color ?? getDomainColor(domainId);
  return <Ionicons name={name} size={size} color={iconColor} />;
}
