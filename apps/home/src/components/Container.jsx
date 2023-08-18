import clsx from 'clsx'

export function Container({ className, ...props }) {
  return (
    <div
      className={clsx('mx-auto  px-4 sm:px-6 lg:px-8', className)}
      {...props}
    />
  )
}
