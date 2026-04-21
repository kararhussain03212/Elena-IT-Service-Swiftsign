import React from 'react'
import Banner from '@/components/Banner';
import Team from './AboutUs/sections/Team';

const OurTeam = () => {
  return (
    <section>
        <Banner title="Our Team" />
        <div>
            <Team />
        </div>
    </section>
  )
}

export default OurTeam