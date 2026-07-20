<?php
require_once __DIR__ . '/BaseModel.php';

class Certification extends BaseModel
{
    protected static string $table = 'certifications';
    protected static array $jsonColumns = ['audience', 'modules', 'benefits', 'fees'];

    /**
     * Retrieve all certifications (auto-seeding if empty)
     */
    public static function getAll(): array
    {
        $certs = self::fetchAll('', [], 'id ASC');
        if (count($certs) === 0) {
            self::seedDatabase();
            $certs = self::fetchAll('', [], 'id ASC');
        }
        return $certs;
    }

    /**
     * Retrieve a certification by its code (case-insensitive)
     */
    public static function getByCode(string $code): ?array
    {
        $certs = self::getAll();
        foreach ($certs as $cert) {
            if (isset($cert['code']) && strtolower($cert['code']) === strtolower($code)) {
                return $cert;
            }
        }
        return null;
    }

    /**
     * Save a registration of interest
     */
    public static function saveRegistration(array $data): bool
    {
        // Validate required fields
        if (empty($data['name']) || empty($data['email']) || empty($data['phone']) || empty($data['certCode'])) {
            return false;
        }

        $sql = "INSERT INTO registrations (name, email, phone, completedPrior, certCode, registeredAt) 
                VALUES (:name, :email, :phone, :completedPrior, :certCode, :registeredAt)";
        $stmt = self::getConnection()->prepare($sql);
        return $stmt->execute([
            'name' => htmlspecialchars(strip_tags($data['name'])),
            'email' => filter_var($data['email'], FILTER_SANITIZE_EMAIL),
            'phone' => htmlspecialchars(strip_tags($data['phone'])),
            'completedPrior' => isset($data['completedPrior']) ? htmlspecialchars(strip_tags($data['completedPrior'])) : 'No',
            'certCode' => htmlspecialchars(strip_tags($data['certCode'])),
            'registeredAt' => now()
        ]);
    }

    /**
     * Seed a single certification document
     */
    public static function create(array $certData): bool
    {
        $columns = [];
        $params = [];
        foreach ($certData as $key => $value) {
            $columns[] = $key;
            if (in_array($key, self::$jsonColumns, true) && is_array($value)) {
                $params[$key] = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            } elseif (is_bool($value)) {
                $params[$key] = $value ? 1 : 0;
            } else {
                $params[$key] = $value;
            }
        }
        
        $timestamp = now();
        $columns[] = 'created_at';
        $columns[] = 'updated_at';
        $params['created_at'] = $timestamp;
        $params['updated_at'] = $timestamp;

        $colPlaceholders = array_map(fn($col) => ':' . $col, $columns);
        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s)',
            self::$table,
            implode(', ', $columns),
            implode(', ', $colPlaceholders)
        );

        $stmt = self::getConnection()->prepare($sql);
        return $stmt->execute($params);
    }

    /**
     * Auto-seed database with core certifications
     */
    private static function seedDatabase(): void
    {
        $seedCerts = [
            [
                'code' => 'SSCC-F',
                'title' => 'Foundation',
                'fullName' => 'Swift Sign Cybersecurity Certification — Foundation (SSCC-F)',
                'isOpen' => true,
                'tagline' => 'Launch your cybersecurity career with essential foundation knowledge, practical labs, and industry best practices.',
                'duration' => 'One-Month Professional Training & Certification Program',
                'dates' => '15 July 2026 to 15 August 2026',
                'mode' => 'Physical Training',
                'prerequisite' => 'None (Undergraduates, Graduates, and Fresh Graduates welcome)',
                'aboutText' => 'Launch your cybersecurity career with the Swift Sign Cybersecurity Certification–Foundation (SSCC-F), a comprehensive one-month program designed to equip university students with essential cybersecurity knowledge, practical skills, and industry best practices.',
                'audience' => [
                    'Undergraduate Students',
                    'Graduate Students',
                    'Fresh Graduates',
                    'Computer Science Students',
                    'Software Engineering Students',
                    'Information Technology Students'
                ],
                'modules' => [
                    'Cybersecurity Fundamentals & Security Landscape',
                    'Networking & Network Security Protocols',
                    'Operating System Security (Windows & Linux Hardening)',
                    'Cryptography Fundamentals & PKI Infrastructure',
                    'Web Application Security & OWASP Top 10',
                    'Ethical Hacking Fundamentals & Scanning Tools',
                    'Security Operations Center (SOC) Fundamentals',
                    'Incident Response & Digital Forensics Basics',
                    'Cloud Security Fundamentals (AWS & Azure Basics)',
                    'Artificial Intelligence in Cybersecurity Operations',
                    'Governance, Risk & Compliance (GRC) Principles',
                    'Capstone Project & Career Placement Mentorship'
                ],
                'benefits' => [
                    'One-Month Intensive Professional Training',
                    'Industry-Oriented, Up-to-Date Curriculum',
                    'Hands-on Practical Labs & Tool Scenarios',
                    'Real-World Cyber Attack Case Studies',
                    'Experienced Industry Trainers & Analysts',
                    'Interactive Classroom Learning Environment',
                    'Career Guidance & Professional Mentorship',
                    'Practical Assessments & Lab Examinations',
                    'Foundation-Level Professional Certification'
                ],
                'outcome' => 'SSCC-F establishes a solid technical baseline. Graduates earn the SSCC-F Foundation Certification, preparing them with the baseline credentials required to join security teams or progress directly to SSCC-A.',
                'fees' => [
                    ['item' => 'Admission / Application Fee (Non-Refundable)', 'amount' => 'PKR 1,000'],
                    ['item' => 'Program Tuition Fee', 'amount' => 'PKR 40,000'],
                    ['item' => 'SSCC University Referral Scholarship', 'amount' => '50% Tuition Fee Waiver'],
                    ['item' => 'Tuition Fee After Scholarship', 'amount' => 'PKR 20,000']
                ],
                'feeFootnote' => 'Eligible students recommended by recognized universities may receive the SSCC University Referral Scholarship (50% waiver on tuition, subject to verification and approval). Terms & Conditions apply.',
                'applicationLink' => 'https://forms.gle/XWwDHQJGpn5Dgs448',
                'qrCodeUrl' => 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://forms.gle/XWwDHQJGpn5Dgs448',
                'footerCta' => 'Register today and begin your journey toward becoming a cybersecurity professional.'
            ],
            [
                'code' => 'SSCC-A',
                'title' => 'Associate',
                'fullName' => 'Swift Sign Cybersecurity Certification — Associate (SSCC-A)',
                'isOpen' => false,
                'tagline' => 'Move beyond fundamentals into hands-on, practitioner-level skills designed for Security Operations Center analyst roles.',
                'duration' => '6–8 Weeks',
                'dates' => 'To be announced',
                'mode' => 'Physical / Hybrid',
                'prerequisite' => 'Completion of SSCC-F (or equivalent foundational knowledge, subject to placement assessment)',
                'aboutText' => 'The Swift Sign Cybersecurity Certification–Associate (SSCC-A) moves beyond fundamentals into hands-on, practitioner-level skills. Designed for those ready to actively work within a security team, SSCC-A builds the technical depth needed to detect, analyze, and respond to real threats.',
                'audience' => [
                    'SSCC-F Certificate Holders',
                    'Junior IT / Network Administrators',
                    'SOC Analyst (Tier 1) aspirants',
                    'IT Professionals transitioning into security roles'
                ],
                'modules' => [
                    'Advanced Networking & Network Defense Infrastructures',
                    'Vulnerability Assessment & Lifecycle Management (Nessus)',
                    'Security Information & Event Management (SIEM Config)',
                    'Threat Detection, Filtering & Log Analysis (Splunk / ELK)',
                    'Malware Analysis Fundamentals & Sandbox Execution',
                    'Identity & Access Management (IAM) Implementations',
                    'Endpoint Security Hardening (EDR rule creation)',
                    'Applied Cryptography & SSL/TLS Implementations',
                    'Cloud Security — Associate Level (AWS/Azure Security Groups)',
                    'Security Tools & Scripting for Analysts (Bash & Python)',
                    'Compliance Frameworks Basics (ISO 27001 & NIST CSF)',
                    'Applied Capstone Lab — SOC Incident Simulation'
                ],
                'benefits' => [
                    'Practitioner-Level, Hands-On Technical Curriculum',
                    'Live SOC Simulation Labs & Event Analysis',
                    'Tool-Based Training (SIEM, vulnerability scanners, IDS/IPS)',
                    'Real Cyber Incident Case Studies & Investigations',
                    'Direct Mentorship from Working Security Analysts',
                    'Direct Progression Path Toward SSCC-P (Professional)'
                ],
                'outcome' => 'Graduates earn the SSCC-A Associate Certification, positioning them for Tier 1/Tier 2 SOC Analyst, Junior Penetration Tester, and IT Security Administrator roles.',
                'fees' => [
                    ['item' => 'Admission / Application Fee (Non-Refundable)', 'amount' => 'To be confirmed'],
                    ['item' => 'Program Tuition Fee', 'amount' => 'To be confirmed'],
                    ['item' => 'SSCC University Referral Scholarship Available', 'amount' => 'Recommended 50% waiver'],
                    ['item' => 'Tuition Fee After Scholarship', 'amount' => 'To be confirmed']
                ],
                'feeFootnote' => 'Scholarship structure is recommended to follow the same referral waiver as SSCC-F for consistency once pricing is finalized.',
                'footerCta' => 'Register your interest today and be notified when Admissions open for the Associate level.'
            ],
            [
                'code' => 'SSCC-P',
                'title' => 'Professional',
                'fullName' => 'Swift Sign Cybersecurity Certification — Professional (SSCC-P)',
                'isOpen' => false,
                'tagline' => 'Master offensive security testing, enterprise security architecture, and advanced threat hunting operations.',
                'duration' => '8–10 Weeks',
                'dates' => 'To be announced',
                'mode' => 'Physical / Hybrid',
                'prerequisite' => 'SSCC-A Certification (or verified equivalent professional experience)',
                'aboutText' => 'The Swift Sign Cybersecurity Certification–Professional (SSCC-P) is built for those ready to lead security operations, not just support them. This level covers offensive security, security architecture, and enterprise-grade risk management — the skill set of a working cybersecurity professional trusted with real infrastructure.',
                'audience' => [
                    'SSCC-A Certificate Holders',
                    'SOC Analysts (Tier 2/3) seeking advancement',
                    'IT Security Officers',
                    'Professionals pursuing penetration testing / security consulting careers'
                ],
                'modules' => [
                    'Advanced Penetration Testing & Active Directory Attacks',
                    'Security Architecture & Secure Enterprise System Design',
                    'Advanced Cloud Security (AWS Security Hub & Azure Defender)',
                    'Threat Intelligence Pipelines & Active Threat Hunting',
                    'Digital Forensics Analysis & Advanced Incident Response (DFIR)',
                    'Application Security Auditing & Secure Code Review',
                    'Enterprise Governance, Risk & Compliance Frameworks (GRC)',
                    'Industrial Control Systems (ICS) & OT Security Basics',
                    'Security Program Management & Metric Dashboarding',
                    'Business Continuity & Disaster Recovery Planning (BCDR)',
                    'Client-Facing Security Consulting & Report Writing',
                    'Professional Capstone — Full Enterprise Security Assessment'
                ],
                'benefits' => [
                    'Offensive + Defensive Security Operations Mastery',
                    'Real Enterprise-Grade Security Assessment Projects',
                    'Alignment with Recognized Industry Standards & Certs',
                    'Consulting & C-Suite Client Communication Training',
                    'Direct Progression Path Toward SSCC-E (Expert)'
                ],
                'outcome' => 'Graduates earn the SSCC-P Professional Certification, qualifying them for roles such as Penetration Tester, Security Consultant, SOC Team Lead, and Security Architect.',
                'fees' => [
                    ['item' => 'Admission / Application Fee (Non-Refundable)', 'amount' => 'To be confirmed'],
                    ['item' => 'Program Tuition Fee', 'amount' => 'To be confirmed'],
                    ['item' => 'Tuition Fee After Scholarship', 'amount' => 'To be confirmed']
                ],
                'feeFootnote' => 'Pricing and referral packages will be announced when admissions approach.',
                'footerCta' => 'Register your interest today and be notified when Admissions open for the Professional level.'
            ],
            [
                'code' => 'SSCC-E',
                'title' => 'Expert',
                'fullName' => 'Swift Sign Cybersecurity Certification — Expert (SSCC-E)',
                'isOpen' => false,
                'tagline' => 'The pinnacle of security command. Lead national and critical-infrastructure cybersecurity strategies.',
                'duration' => '10–12 Weeks',
                'dates' => 'To be announced',
                'mode' => 'Physical / Hybrid',
                'prerequisite' => 'SSCC-P Certification (or verified senior-level industry experience)',
                'aboutText' => 'The Swift Sign Cybersecurity Certification–Expert (SSCC-E) is the top of the SSCC path — built for professionals ready to lead cybersecurity strategy at the highest level. This program develops the strategic, technical, and command-level capability to design and run enterprise and national-scale cybersecurity operations.',
                'audience' => [
                    'SSCC-P Certificate Holders',
                    'Senior Security Consultants / Architects',
                    'Aspiring CISOs and Security Directors',
                    'Professionals targeting national or critical-infrastructure security roles'
                ],
                'modules' => [
                    'Cybersecurity Strategy & Enterprise Executive Leadership',
                    'National Security & Critical Infrastructure Protection',
                    'Advanced Threat Intel & Nation-State Threat Analysis',
                    'Cyber Crisis Command, Response & Public Communications',
                    'Enterprise Risk Management & Security Investment ROI',
                    'Cyber Law, International Policies & Regional Compliances',
                    'Security Operations Center (SOC) Design & Leadership',
                    'Advanced Red Team / Blue Team Active Command Exercises',
                    'M&A Cyber Security Due Diligence & Third-Party Risk',
                    'Building, Retaining & Leading Elite Security Teams',
                    'Board-Level Security Reporting & C-Suite Communication',
                    'Expert Capstone — National/Enterprise Security Simulation'
                ],
                'benefits' => [
                    'Executive & Strategy Command-Level Cyber Training',
                    'Strategic, Corporate Governance & National Risk Curriculum',
                    'Simulated Command of National-Scale Cyber Crisis Operations',
                    'Direct Mentorship from CISOs & Senior Industry Leaders',
                    'Dedicated Career Placement Support'
                ],
                'outcome' => 'Graduates earn the SSCC-E Expert Certification — the highest credential in the SSCC path, signifying readiness to lead and direct large-scale cybersecurity operations at an enterprise or national level. Graduates receive dedicated career placement support, connecting them with organizations seeking senior cybersecurity leadership.',
                'fees' => [
                    ['item' => 'Admission / Application Fee (Non-Refundable)', 'amount' => 'To be confirmed'],
                    ['item' => 'Program Tuition Fee', 'amount' => 'To be confirmed'],
                    ['item' => 'Tuition Fee After Scholarship', 'amount' => 'To be confirmed']
                ],
                'feeFootnote' => 'Dedicated career placement is assurance-aligned. Contact advisors for detailed pricing.',
                'footerCta' => 'Register your interest today and be notified when Admissions open for the Expert level.'
            ]
        ];

        foreach ($seedCerts as $cert) {
            self::create($cert);
        }
    }
}

