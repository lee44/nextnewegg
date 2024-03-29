import { Menu, Transition } from '@headlessui/react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import React, { Fragment, MouseEvent, useRef } from 'react'
import AdminMenuItems from './AdminMenuItems'
import UserMenuItems from './UserMenuItems'

const ProfileButton = () => {
    const { data: session } = useSession()
    const router = useRouter();
    const menuButton = useRef<HTMLButtonElement | null>(null)

    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className="flex items-center justify-center w-full gap-4 px-4 py-2 text-sm font-medium rounded-md hover:bg-white dark:text-white bg-opacity-20 hover:bg-opacity-30 ring-0 outline-0"
                    onMouseEnter={(event: MouseEvent<HTMLButtonElement>) => event.currentTarget.click()} ref={menuButton}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                        <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                    </svg>
                    {session?.user?.name}
                </Menu.Button>
            </div>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 mt-3 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg w-[152px] ring-1 ring-black ring-opacity-5 focus:outline-none"
                    onMouseLeave={() => { menuButton?.current?.click() }}>
                    <div className="px-1 py-1">
                        {session && <AdminMenuItems />}
                        <UserMenuItems />
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>

    )
}

export default ProfileButton