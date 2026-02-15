'use client'

import Link from 'next/link'

import UserMenu from './UserMenu'

interface HeaderProps {
  title?: string
  showBack?: boolean
  backHref?: string
}

export default function Header({ title = '和椿通路營業管理系統', showBack = false, backHref = '/' }: HeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        {showBack && (
          <Link 
            href={backHref}
            className="text-gray-400 hover:text-gray-600 transition text-2xl"
            title="返回"
          >
            ←
          </Link>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <Link 
          href="/admin" 
          className="text-gray-400 hover:text-gray-600 transition"
          title="後台管理"
        >
          ⚙️
        </Link>
        <UserMenu />
      </div>
    </div>
  )
}
