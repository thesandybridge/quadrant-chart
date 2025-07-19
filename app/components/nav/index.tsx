import Link from "next/link";
import styles from './styles.module.css';

export default function Nav() {
  return (
    <div className={styles.container}>
      <Link href={'/charts/quadrant'}>
        Quadrant Chart
      </Link>
      <Link href={'/charts/area'}>
        Area Chart
      </Link>
      <Link href={'/charts/radar'}>
        Radar Chart
      </Link>
    </div>
  )
}
