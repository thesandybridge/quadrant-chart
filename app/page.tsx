import Link from "next/link";
import styles from './styles.module.css';

export default function Page() {
  return (
    <div className={styles.container}>
      <Link href={'/charts/quadrant'}>
        Quadrant Chart
      </Link>
      <Link href={'/charts/area'}>
        Area Chart
      </Link>
    </div>
  )
}
