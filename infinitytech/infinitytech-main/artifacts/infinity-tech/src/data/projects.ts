export interface ProjectFile {
  id: string;
  name: string;
  type: "gerbers" | "schematic" | "model3d" | "source";
  description: string;
  size: string;
  url?: string;
}

export interface ProjectMedia {
  id: string;
  type: "image" | "video";
  url: string;
  caption?: string;
  captionAr?: string;
  thumbnail?: string;
}

export interface ProjectUpdate {
  id: string;
  date: string;
  version: string;
  title: string;
  titleAr: string;
  desc: string;
  descAr: string;
  type: "release" | "fix" | "feature" | "design" | "test" | "note";
  adminOnly?: boolean;
}

export interface Project {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  tags: string[];
  overview: string;
  overviewAr: string;
  problem: string;
  problemAr: string;
  solution: string;
  solutionAr: string;
  codeSnippet: string;
  language: string;
  timeline: { date: string; title: string; desc: string }[];
  githubUrl: string;
  liveUrl?: string;
  category?: string;
  thumbnailUrl?: string;
  status: "completed" | "active" | "archived";
  files: ProjectFile[];
  media: ProjectMedia[];
  updates: ProjectUpdate[];
}

export const MOCK_PROJECTS: Project[] = [
  {
    id: "neural-pcb",
    title: "Neural PCB Controller",
    titleAr: "وحدة تحكم PCB عصبية",
    description: "AI-powered motor control board for precision robotics with onboard inference capabilities.",
    descriptionAr: "لوحة تحكم في المحرك مدعومة بالذكاء الاصطناعي للروبوتات الدقيقة مع إمكانات استنتاج متكاملة.",
    tags: ["PCB", "AI", "Embedded"],
    overview: "A custom 4-layer PCB designed to handle high-current motor control while simultaneously running lightweight neural networks for predictive maintenance and anomaly detection.",
    overviewAr: "لوحة PCB مخصصة رباعية الطبقات مصممة للتحكم في المحرك بتيار عالٍ مع تشغيل شبكات عصبية خفيفة للصيانة التنبؤية واكتشاف الشذوذات.",
    problem: "Traditional motor controllers lack the ability to adapt to wear and tear in real-time, leading to sudden mechanical failures in remote environments.",
    problemAr: "تفتقر وحدات التحكم التقليدية إلى قدرة التكيف مع التآكل في الوقت الفعلي، مما يؤدي إلى أعطال ميكانيكية مفاجئة في البيئات النائية.",
    solution: "Integrated an STM32H7 MCU with a dedicated neural processing unit (NPU) and custom gate drivers. The firmware continuously samples current and back-EMF, passing it through a quantized TinyML model to adjust PID parameters dynamically.",
    solutionAr: "تم دمج معالج STM32H7 مع وحدة معالجة عصبية مخصصة وبرامج بوابة مخصصة. يأخذ البرنامج الثابت عينات مستمرة من التيار والـ EMF ويمررها عبر نموذج TinyML لضبط معاملات PID ديناميكياً.",
    language: "c",
    codeSnippet: `// Inference loop for predictive maintenance
void update_motor_state(Motor_Handle_t* motor) {
    float features[4] = { motor->current, motor->velocity, motor->temp, motor->vibration };
    
    // Run quantized model
    int8_t prediction = tflite_predict(features);
    
    if (prediction == ANOMALY_DETECTED) {
        trigger_safe_shutdown();
        log_error("Acoustic anomaly detected in bearing.");
    } else {
        apply_pid_control(motor);
    }
}`,
    githubUrl: "https://github.com/infinitytech-dev/neural-pcb-controller",
    status: "completed",
    timeline: [
      { date: "Oct 2024", title: "Architecture Design", desc: "Selected STM32H7 and defined power path." },
      { date: "Nov 2024", title: "PCB Routing", desc: "Completed 4-layer layout with strict impedance control." },
      { date: "Jan 2025", title: "Firmware Integration", desc: "Deployed TensorFlow Lite for Microcontrollers." },
    ],
    files: [
      { id: "f1", name: "neural-pcb_gerbers_v1.2.zip", type: "gerbers", description: "Production Gerber files — JLCPCB/PCBWay ready", size: "2.4 MB" },
      { id: "f2", name: "neural-pcb_schematic_v1.2.pdf", type: "schematic", description: "Full schematic — KiCad exported PDF", size: "1.1 MB" },
      { id: "f3", name: "neural-pcb_3dmodel.step", type: "model3d", description: "STEP 3D model for mechanical fit check", size: "8.7 MB" },
      { id: "f4", name: "neural-pcb_firmware.zip", type: "source", description: "STM32CubeIDE project — FreeRTOS + TFLite", size: "4.3 MB" },
    ],
    media: [
      { id: "m1", type: "image", url: "", caption: "Top copper layer — 4-layer stackup", captionAr: "طبقة النحاس العلوية — تكديس 4 طبقات" },
      { id: "m2", type: "image", url: "", caption: "Assembled prototype board", captionAr: "لوحة النموذج الأولي المجمّعة" },
      { id: "m3", type: "image", url: "", caption: "Bench test setup — oscilloscope reading", captionAr: "إعداد الاختبار — قراءة الأوسيلوسكوب" },
      { id: "m4", type: "image", url: "", caption: "Motor control waveform — 8kHz PWM", captionAr: "موجة التحكم — PWM 8 كيلوهرتز" },
    ],
    updates: [
      { id: "u1", date: "2025-01-15", version: "v1.2.0", title: "TFLite Model Optimized", titleAr: "تحسين نموذج TFLite", desc: "Quantized INT8 model reduces inference time from 4.2ms to 1.1ms.", descAr: "نموذج INT8 المحول يقلل وقت الاستنتاج من 4.2 مللي ثانية إلى 1.1 مللي ثانية.", type: "feature" },
      { id: "u2", date: "2024-12-10", version: "v1.1.0", title: "Gate Driver Rework", titleAr: "إعادة تصميم برنامج البوابة", desc: "Fixed shoot-through risk on half-bridge section, added dead-time control.", descAr: "إصلاح خطر التمرير العرضي في قسم الجسر النصفي وإضافة التحكم في الوقت الميت.", type: "fix" },
      { id: "u3", date: "2024-11-01", version: "v1.0.0", title: "Initial Production Release", titleAr: "الإصدار الإنتاجي الأول", desc: "First 10 boards manufactured and tested. EMI within CISPR 32B limits.", descAr: "تصنيع واختبار أول 10 لوحات. الـ EMI ضمن حدود CISPR 32B.", type: "release" },
      { id: "u4", date: "2024-10-20", version: "v0.9.0", title: "Thermal Analysis (Admin)", titleAr: "تحليل حراري (مشرف)", desc: "Junction temps under worst-case load: Q1 @ 87°C, Q2 @ 91°C. Heatsink added.", descAr: "درجات حرارة الوصلة تحت أقصى حمل: Q1 عند 87°م, Q2 عند 91°م. تمت إضافة مشتت حرارة.", type: "note", adminOnly: true },
    ],
  },
  {
    id: "ros2-rover",
    title: "ROS2 Autonomous Rover",
    titleAr: "مركبة ROS2 ذاتية القيادة",
    description: "6-wheel planetary rover prototype with SLAM and obstacle avoidance.",
    descriptionAr: "نموذج مركبة كوكبية ذات 6 عجلات مع رسم الخرائط وتجنب العوائق تلقائياً.",
    tags: ["Robotics", "Embedded", "AI"],
    overview: "An autonomous terrestrial exploration platform built on ROS2 Humble. Features a custom rocker-bogie suspension and a sensor suite including 3D LiDAR, stereo cameras, and IMU.",
    overviewAr: "منصة استكشاف أرضية مستقلة مبنية على ROS2 Humble، تتميز بنظام تعليق روكر-بوجي مخصص ومجموعة مستشعرات تضم ليدار ثلاثي الأبعاد وكاميرات ستيريو ووحدة IMU.",
    problem: "Off-the-shelf development rovers struggle with rough, unstructured terrain while maintaining accurate localization.",
    problemAr: "تعاني مركبات التطوير الجاهزة من صعوبة التنقل في التضاريس الوعرة وغير المنظمة مع الحفاظ على تحديد الموقع الدقيق.",
    solution: "Implemented an advanced sensor fusion pipeline combining wheel odometry, visual odometry, and LiDAR using an Extended Kalman Filter (EKF). The navigation stack uses Nav2 for path planning.",
    solutionAr: "تم تطبيق خط أنابيب متقدم لدمج الحساسات يجمع بين قياس الحركة البصري والليدار باستخدام EKF، مع مكدس ملاحي Nav2 لتخطيط المسار.",
    language: "python",
    codeSnippet: `def compute_velocity_commands(self, current_pose, goal_pose):
    # Calculate angular and linear velocity using custom MPC
    distance = math.hypot(goal_pose.x - current_pose.x, goal_pose.y - current_pose.y)
    angle_to_goal = math.atan2(goal_pose.y - current_pose.y, goal_pose.x - current_pose.x)
    
    heading_error = normalize_angle(angle_to_goal - current_pose.theta)
    
    cmd = Twist()
    cmd.angular.z = self.kp_angular * heading_error
    cmd.linear.x = self.kp_linear * distance * math.cos(heading_error)
    
    return cmd`,
    githubUrl: "https://github.com/infinitytech-dev/ros2-autonomous-rover",
    status: "active",
    timeline: [
      { date: "Jun 2024", title: "Mechanical Build", desc: "Machined aluminum chassis and mounted servos." },
      { date: "Aug 2024", title: "Sensor Bring-up", desc: "Calibrated LiDAR and RealSense cameras." },
      { date: "Sep 2024", title: "Autonomous Nav", desc: "Successfully navigated a 1km outdoor obstacle course." },
    ],
    files: [
      { id: "f1", name: "rover_chassis_3dmodel.step", type: "model3d", description: "Full chassis STEP file for CNC/3D print", size: "22.1 MB" },
      { id: "f2", name: "rover_pcb_gerbers_v2.zip", type: "gerbers", description: "Custom sensor board Gerber files", size: "1.8 MB" },
      { id: "f3", name: "rover_schematic.pdf", type: "schematic", description: "Power and sensor board schematic", size: "900 KB" },
      { id: "f4", name: "ros2_rover_ws.zip", type: "source", description: "Full ROS2 workspace — Python/C++", size: "14.2 MB" },
    ],
    media: [
      { id: "m1", type: "image", url: "", caption: "Rocker-bogie suspension assembled", captionAr: "تجميع نظام تعليق روكر-بوجي" },
      { id: "m2", type: "image", url: "", caption: "LiDAR point cloud — outdoor test", captionAr: "سحابة نقاط ليدار — اختبار خارجي" },
      { id: "m3", type: "image", url: "", caption: "RViz2 — EKF localization map", captionAr: "RViz2 — خريطة EKF للتحديد الموقعي" },
      { id: "m4", type: "video", url: "", caption: "1km autonomous run — timelapse", captionAr: "رحلة مستقلة 1 كم — فيديو مسرّع" },
    ],
    updates: [
      { id: "u1", date: "2025-02-18", version: "v2.1.0", title: "Nav2 Costmap Tuning", titleAr: "ضبط خريطة التكلفة Nav2", desc: "Reduced inflation radius to 0.35m, improving corridor navigation in tight spaces.", descAr: "تقليل نصف قطر التضخيم إلى 0.35 متر مما حسّن التنقل في الممرات الضيقة.", type: "feature" },
      { id: "u2", date: "2024-09-30", version: "v2.0.0", title: "EKF Integration Complete", titleAr: "اكتمال تكامل EKF", desc: "Wheel + IMU + LiDAR EKF fusion achieving <5cm localization error.", descAr: "دمج EKF للعجلة والـ IMU والليدار محقق خطأ تحديد موقعي أقل من 5 سم.", type: "release" },
      { id: "u3", date: "2024-08-05", version: "v1.0.0", title: "First Autonomous Movement", titleAr: "أول حركة مستقلة", desc: "Rover successfully completed a 50m loop in a controlled environment.", descAr: "أكملت المركبة بنجاح حلقة 50 متر في بيئة محكومة.", type: "release" },
    ],
  },
  {
    id: "stm32-fc",
    title: "STM32 Flight Controller",
    titleAr: "وحدة تحكم طيران STM32",
    description: "Custom drone flight controller utilizing high-speed hardware SPI for sensor fusion.",
    descriptionAr: "وحدة تحكم طيران مخصصة للدرون تستخدم SPI عتادية عالية السرعة لدمج الاستشعار.",
    tags: ["PCB", "Embedded", "Firmware"],
    overview: "A lightweight, FPV-focused flight controller utilizing an STM32F4 processor running at 168MHz, designed for ultra-low latency loop times.",
    overviewAr: "وحدة تحكم طيران خفيفة الوزن موجهة للـ FPV، تستخدم معالج STM32F4 يعمل بتردد 168 ميغاهرتز، مصممة لتحقيق زمن دوران منخفض للغاية.",
    problem: "Standard betaflight controllers have proprietary limitations that make them difficult to use for novel thrust-vectoring research.",
    problemAr: "وحدات التحكم القياسية تفرض قيوداً مملوكة تجعل تخصيصها صعباً لأبحاث توجيه الدفع الجديدة.",
    solution: "Built a from-scratch RTOS-based flight controller with an MPU6000 gyro on a dedicated SPI bus polling at 8kHz, passing data to a custom quaternion-based filter.",
    solutionAr: "بنيت وحدة تحكم طيران من الصفر قائمة على RTOS مع جيروسكوب MPU6000 على حافلة SPI مخصصة تعمل بتردد 8 كيلوهرتز، وفلتر رباعي مخصص.",
    language: "c",
    codeSnippet: `void imu_read_task(void *pvParameters) {
    uint8_t rx_buffer[14];
    while(1) {
        spi_read_registers(MPU_REG_ACCEL_XOUT_H, rx_buffer, 14);
        
        // Parse big-endian to int16
        sensor_data.accel_x = (rx_buffer[0] << 8) | rx_buffer[1];
        sensor_data.gyro_x  = (rx_buffer[8] << 8) | rx_buffer[9];
        
        apply_madgwick_filter(&sensor_data);
        vTaskDelay(pdMS_TO_TICKS(1)); // 1kHz loop
    }
}`,
    githubUrl: "https://github.com/infinitytech-dev/stm32-flight-controller",
    status: "completed",
    timeline: [
      { date: "Feb 2024", title: "Schematic", desc: "Designed power delivery and MCU peripheral map." },
      { date: "Mar 2024", title: "Manufacturing", desc: "Received and hand-soldered prototype boards." },
      { date: "May 2024", title: "Maiden Flight", desc: "Achieved stable hover with custom PID loops." },
    ],
    files: [
      { id: "f1", name: "fc_gerbers_v3.zip", type: "gerbers", description: "Flight controller Gerber files v3", size: "1.9 MB" },
      { id: "f2", name: "fc_schematic_v3.pdf", type: "schematic", description: "Complete schematic with STM32F4 peripherals", size: "780 KB" },
      { id: "f3", name: "fc_board_3d.step", type: "model3d", description: "3D board model for frame mounting", size: "5.4 MB" },
      { id: "f4", name: "fc_firmware.zip", type: "source", description: "FreeRTOS firmware — Madgwick filter + PID", size: "3.1 MB" },
    ],
    media: [
      { id: "m1", type: "image", url: "", caption: "Flight controller — top view", captionAr: "وحدة التحكم — منظر علوي" },
      { id: "m2", type: "image", url: "", caption: "SPI routing — impedance controlled traces", captionAr: "توجيه SPI — خطوط بعوائق محكومة" },
      { id: "m3", type: "image", url: "", caption: "Maiden flight — stable hover test", captionAr: "أول رحلة — اختبار الثبات" },
    ],
    updates: [
      { id: "u1", date: "2024-05-20", version: "v3.0.0", title: "Maiden Flight Success", titleAr: "نجاح أول رحلة", desc: "Stable 8-minute hover. PID auto-tune within 3 iterations.", descAr: "تحليق مستقر لمدة 8 دقائق. ضبط PID تلقائي في 3 تكرارات.", type: "release" },
      { id: "u2", date: "2024-04-01", version: "v2.0.0", title: "Gyro SPI Bus Isolation", titleAr: "عزل حافلة SPI للجيروسكوب", desc: "Moved MPU6000 to dedicated SPI, reducing IMU jitter by 70%.", descAr: "نقل MPU6000 إلى SPI مخصص مما قلل الاهتزاز بنسبة 70%.", type: "fix" },
      { id: "u3", date: "2024-02-15", version: "v1.0.0", title: "Schematic Complete", titleAr: "اكتمال المخطط الكهربائي", desc: "Full schematic peer-reviewed. Power path rated 4S LiPo continuous.", descAr: "مراجعة كاملة للمخطط. مسار الطاقة مصنف لبطاريات LiPo رباعية الخلايا.", type: "design" },
    ],
  },
  {
    id: "power-management-pcb",
    title: "Power Management PCB",
    titleAr: "لوحة إدارة الطاقة",
    description: "6-layer multi-rail power supply board with GaN switching and precision regulation.",
    descriptionAr: "لوحة طاقة سداسية الطبقات بتقنية GaN عالية الكفاءة مع تنظيم دقيق متعدد الخطوط.",
    tags: ["PCB", "Power", "Hardware"],
    overview: "A compact 6-layer power management board delivering four regulated rails (1.0V, 1.8V, 3.3V, 12V) from a 24V industrial input, using GaN FETs for high-efficiency switching at 500kHz.",
    overviewAr: "لوحة إدارة طاقة مدمجة سداسية الطبقات توفر أربعة شرائح منظمة من مدخل صناعي 24 فولت، مستخدمةً ترانزستورات GaN للتشغيل بكفاءة عالية عند 500 كيلوهرتز.",
    problem: "Industrial embedded systems require multiple isolated power rails with tight load regulation and EMI compliance, which off-the-shelf modules cannot meet in high-vibration environments.",
    problemAr: "الأنظمة المضمنة الصناعية تتطلب شرائح طاقة متعددة ومعزولة مع تنظيم دقيق للحمل والتوافق مع EMI، وهو ما لا تحققه الوحدات الجاهزة في بيئات الاهتزاز العالية.",
    solution: "Designed a custom synchronous buck converter cascade with GaN switching transistors, differential pair routing for feedback traces, and a dedicated power plane stackup to minimize loop inductance.",
    solutionAr: "تصميم سلسلة محول Buck متزامن مخصص مع ترانزستورات GaN، وتوجيه أزواج تفاضلية لخطوط التغذية الراجعة، ومكدس طائرات طاقة مخصص لتقليل حث الحلقة.",
    language: "c",
    codeSnippet: `// Power sequencing controller
void power_sequence_init(void) {
    // Rail 1: 12V — enable first, wait for PG
    gpio_set(EN_12V);
    while (!gpio_read(PG_12V)) { delay_us(10); }

    // Rail 2: 3.3V — depends on 12V rail
    gpio_set(EN_3V3);
    while (!gpio_read(PG_3V3)) { delay_us(10); }

    // Rail 3: 1.8V core
    gpio_set(EN_1V8);
    delay_ms(2);

    log_event(SEQ_COMPLETE);
}`,
    githubUrl: "https://github.com/infinitytech-dev/power-management-pcb",
    status: "completed",
    timeline: [
      { date: "Mar 2024", title: "Schematic", desc: "Defined rail topology and GaN gate driver selection." },
      { date: "Apr 2024", title: "6-Layer Layout", desc: "Routed switching loops under 200pH inductance." },
      { date: "Jun 2024", title: "EMI Testing", desc: "Passed CISPR 32 Class B radiated emissions." },
    ],
    files: [
      { id: "f1", name: "pwr_gerbers_v2.zip", type: "gerbers", description: "6-layer power board Gerber files", size: "3.2 MB" },
      { id: "f2", name: "pwr_schematic_v2.pdf", type: "schematic", description: "Multi-rail power schematic with GaN drivers", size: "1.3 MB" },
      { id: "f3", name: "pwr_board_3d.step", type: "model3d", description: "3D model with heatsink clearance", size: "9.1 MB" },
      { id: "f4", name: "pwr_sequencer_fw.zip", type: "source", description: "Power sequencer firmware — STM32L0", size: "890 KB" },
    ],
    media: [
      { id: "m1", type: "image", url: "", caption: "6-layer board — power plane visualization", captionAr: "لوحة سداسية الطبقات — تصور طائرة الطاقة" },
      { id: "m2", type: "image", url: "", caption: "GaN switching node — 500kHz waveform", captionAr: "عقدة GaN — موجة 500 كيلوهرتز" },
      { id: "m3", type: "image", url: "", caption: "EMI pre-compliance scan results", captionAr: "نتائج فحص التوافق الأولي لـ EMI" },
      { id: "m4", type: "image", url: "", caption: "Thermal imaging under full load", captionAr: "التصوير الحراري تحت الحمل الكامل" },
    ],
    updates: [
      { id: "u1", date: "2024-07-10", version: "v2.0.0", title: "CISPR 32B Compliance Achieved", titleAr: "تحقيق توافق CISPR 32B", desc: "All four rails within limits. Peak emissions at 87dBμV/m vs 90dBμV/m limit.", descAr: "جميع الخطوط الأربعة ضمن الحدود. ذروة الانبعاثات عند 87 ديسيبل مقابل حد 90 ديسيبل.", type: "test" },
      { id: "u2", date: "2024-05-15", version: "v1.5.0", title: "Switching Loop Rework", titleAr: "إعادة تصميم حلقة التشغيل", desc: "Reduced power loop area to <12mm². Inductance dropped from 800pH to 185pH.", descAr: "تقليل مساحة حلقة الطاقة إلى أقل من 12 مم². انخفض الحث من 800 بيكوهنري إلى 185 بيكوهنري.", type: "fix" },
      { id: "u3", date: "2024-03-01", version: "v1.0.0", title: "Initial Design Release", titleAr: "الإصدار التصميمي الأول", desc: "Schematic complete. Rail topology validated in simulation (LTspice).", descAr: "اكتمال المخطط. تم التحقق من توبولوجيا الخطوط في المحاكاة (LTspice).", type: "release" },
    ],
  },
  {
    id: "can-analyzer",
    title: "CAN Bus Analyzer",
    titleAr: "محلل ناقل CAN",
    description: "Real-time CAN bus diagnostic tool with a high-speed USB interface.",
    descriptionAr: "أداة تشخيص ناقل CAN في الوقت الفعلي مع واجهة USB عالية السرعة.",
    tags: ["PCB", "Firmware", "Embedded"],
    overview: "A diagnostic tool for automotive and industrial engineering that sits between a CAN network and a PC, sniffing, decoding, and injecting frames with microsecond precision.",
    overviewAr: "أداة تشخيصية للهندسة السيارات والصناعية تتوضع بين شبكة CAN وجهاز الكمبيوتر، لالتقاط وفك تشفير وحقن إطارات CAN بدقة ميكروثانية.",
    problem: "Professional CAN tools are prohibitively expensive, and cheap alternatives drop frames at high bus loads.",
    problemAr: "أدوات CAN الاحترافية باهظة التكلفة، والبدائل الرخيصة تفقد الإطارات عند أحمال الناقل العالية.",
    solution: "Designed a dual-core MCU architecture where one core solely services CAN interrupts and DMA, while the second handles USB bulk transfers to the host PC.",
    solutionAr: "تصميم معمارية MCU ثنائية النواة: نواة واحدة مخصصة لمعالجة انقطاعات CAN وDMA، والأخرى لمعالجة نقل USB إلى جهاز المضيف.",
    language: "c",
    codeSnippet: `void HAL_CAN_RxFifo0MsgPendingCallback(CAN_HandleTypeDef *hcan) {
    CAN_RxHeaderTypeDef rxHeader;
    uint8_t rxData[8];
    
    if (HAL_CAN_GetRxMessage(hcan, CAN_RX_FIFO0, &rxHeader, rxData) == HAL_OK) {
        // Push directly to ring buffer for Core 2
        RingBuffer_Write(&can_rx_buffer, rxHeader.StdId, rxData, rxHeader.DLC);
        
        // Wake up USB task if needed
        BaseType_t xHigherPriorityTaskWoken = pdFALSE;
        vTaskNotifyGiveFromISR(usbTaskHandle, &xHigherPriorityTaskWoken);
    }
}`,
    githubUrl: "https://github.com/infinitytech-dev/can-bus-analyzer",
    status: "completed",
    timeline: [
      { date: "Nov 2023", title: "Concept", desc: "Analyzed limitations in existing open-source tools." },
      { date: "Dec 2023", title: "Firmware", desc: "Implemented lock-free ring buffers for cross-core comms." },
      { date: "Jan 2024", title: "Release", desc: "Open-sourced the hardware and GUI client." },
    ],
    files: [
      { id: "f1", name: "can_analyzer_gerbers.zip", type: "gerbers", description: "CAN analyzer PCB Gerbers", size: "1.4 MB" },
      { id: "f2", name: "can_analyzer_schematic.pdf", type: "schematic", description: "Dual-core CAN+USB schematic", size: "650 KB" },
      { id: "f3", name: "can_firmware.zip", type: "source", description: "Dual-core firmware + Python GUI client", size: "6.8 MB" },
    ],
    media: [
      { id: "m1", type: "image", url: "", caption: "CAN analyzer PCB — assembled", captionAr: "لوحة محلل CAN — مجمّعة" },
      { id: "m2", type: "image", url: "", caption: "GUI client — live frame decode", captionAr: "عميل الواجهة — فك تشفير فوري" },
    ],
    updates: [
      { id: "u1", date: "2024-02-20", version: "v1.2.0", title: "GUI Released", titleAr: "إطلاق واجهة المستخدم", desc: "Python Qt5 client with DBC file support for signal decoding.", descAr: "عميل Python Qt5 مع دعم ملفات DBC لفك تشفير الإشارات.", type: "feature" },
      { id: "u2", date: "2024-01-15", version: "v1.0.0", title: "Open Source Release", titleAr: "إصدار مفتوح المصدر", desc: "Hardware and firmware open-sourced under MIT license.", descAr: "العتاد والبرنامج الثابت مفتوح المصدر تحت رخصة MIT.", type: "release" },
    ],
  },
  {
    id: "soft-gripper",
    title: "Soft Robotic Gripper",
    titleAr: "قابض روبوتي مرن",
    description: "Pneumatic soft robotic gripper system for handling delicate objects.",
    descriptionAr: "نظام قابض روبوتي هوائي للتعامل مع الأشياء الحساسة.",
    tags: ["Robotics", "AI"],
    overview: "A multi-fingered soft gripper molded from silicone elastomers, controlled by an array of proportional pneumatic valves.",
    overviewAr: "قابض متعدد الأصابع مصبوب من مرونيات السيليكون، يُتحكم فيه بمجموعة من صمامات الضغط المتناسبة.",
    problem: "Rigid grippers damage soft agricultural products and require precise kinematics.",
    problemAr: "القابضات الصلبة تتلف المنتجات الزراعية الطرية وتتطلب كينماتيكا دقيقة تجعل استخدامها معقداً.",
    solution: "Created fluidic elastomer actuators controlled by a pressure-feedback loop and a vision-based AI model to determine the optimal gripping pressure.",
    solutionAr: "إنشاء مشغلات مرنة سائلة مع حلقة تحكم في الضغط ونموذج ذكاء اصطناعي قائم على الرؤية لتحديد ضغط القبض الأمثل.",
    language: "python",
    codeSnippet: `def grasp_object(target_type):
    target_pressure = lookup_optimal_pressure(target_type)
    
    while current_pressure < target_pressure:
        valve.set_pwm(calculate_pid(target_pressure, current_pressure))
        
        if tactile_sensor.read() > SLIP_THRESHOLD:
            # Adjust grip dynamically if slipping is detected
            target_pressure += 0.5
            
        time.sleep(0.01)
    
    return True`,
    githubUrl: "https://github.com/infinitytech-dev/soft-robotic-gripper",
    status: "archived",
    timeline: [
      { date: "Mar 2024", title: "Casting", desc: "3D printed molds and casted silicone actuators." },
      { date: "Apr 2024", title: "Pneumatics", desc: "Built valve manifold and control circuitry." },
      { date: "May 2024", title: "Testing", desc: "Successfully grasped items ranging from eggs to heavy tools." },
    ],
    files: [
      { id: "f1", name: "gripper_molds_3d.zip", type: "model3d", description: "Silicone mold STL files for 3D printing", size: "18.4 MB" },
      { id: "f2", name: "valve_pcb_gerbers.zip", type: "gerbers", description: "Valve driver PCB Gerbers", size: "1.1 MB" },
      { id: "f3", name: "gripper_control_code.zip", type: "source", description: "Python control + ROS2 gripper node", size: "2.7 MB" },
    ],
    media: [
      { id: "m1", type: "image", url: "", caption: "Silicone finger — cross section", captionAr: "إصبع السيليكون — مقطع عرضي" },
      { id: "m2", type: "image", url: "", caption: "Grasping a raw egg — no damage", captionAr: "قبض بيضة نيئة — دون أي ضرر" },
      { id: "m3", type: "video", url: "", caption: "Live gripper demo — fruit sorting", captionAr: "عرض حي — فرز الفواكه" },
    ],
    updates: [
      { id: "u1", date: "2024-05-30", version: "v1.0.0", title: "Research Paper Submitted", titleAr: "تقديم ورقة بحثية", desc: "Submitted to IEEE ICRA 2025 — gripping force accuracy ±2.3%.", descAr: "مقدمة إلى IEEE ICRA 2025 — دقة قوة القبض ±2.3%.", type: "release" },
      { id: "u2", date: "2024-04-12", version: "v0.9.0", title: "Vision AI Integrated", titleAr: "تكامل رؤية الذكاء الاصطناعي", desc: "YOLOv8 object classification triggers pressure lookup table.", descAr: "تصنيف الكائنات بـ YOLOv8 يُشغّل جدول بحث الضغط.", type: "feature" },
    ],
  },
];
